// Environment configuration
require("dotenv").config();

// Native and third-party modules
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const { initializeDatabase } = require("../scripts/dbSetup");
const {
  fetchTicketClassification,
} = require("./db_queries/fetchTicketClassification");
const { getTicketFields } = require("./db_queries/fetchAndStoreTicketField");
const { classifyTicket } = require("./openai");

// Constants
const app = express();
const PORT = process.env.PORT || 3000;
// This signing secret is the one ZD always uses when testing webhooks before creation. It's not the same as the one you'd use in production. Replace this with ZD_SIGNING_SECRET from your .env file after activating the webhook.
const TEST_SIGNING_SECRET = "dGhpc19zZWNyZXRfaXNfZm9yX3Rlc3Rpbmdfb25seQ==";

// Helper function to validate the signature of incoming requests
function isValidSignature(signature, body, timestamp) {
  const hmac = crypto.createHmac("sha256", TEST_SIGNING_SECRET);
  const data = `${timestamp}.${body}`;
  const digest = `v0=${hmac.update(data).digest("hex")}`;
  return signature === digest;
}

async function updateZendeskTicket(ticket_id, classification) {
  const urlEncodedTicketId = encodeURIComponent(ticket_id);
  let config;
  if (classification.category === "unknown") {
    config = {
      headers: {
        'Authorization': `Basic ${process.env.ZD_AUTH}`,
        'Content-Type': 'application/json'
      },
      method: "PUT",
      url: `https://${process.env.ZD_SUBDOMAIN}.zendesk.com/api/v2/tickets/update_many`,
      params: { ids: urlEncodedTicketId },
      data: JSON.stringify({
        tickets: [
          {
            id: ticket_id,
            additional_tags: ["human_triage_required"],
          },
        ],
      }),
    };
  }

  config = {
    method: "PUT",
    url: `https://${process.env.ZD_SUBDOMAIN}.zendesk.com/api/v2/tickets/update_many`,
    headers: {
      'Authorization': `Basic ${process.env.ZD_AUTH}`,
      'Content-Type': 'application/json'
    },
    params: { ids: urlEncodedTicketId },
    data: JSON.stringify({
      tickets: [
        {
          id: ticket_id,
          custom_fields: [
            {
              id: process.env.ZENDESK_FIELD_ID,
              value: classification.category,
            },
          ],
        },
      ],
    }),
  };
  try {
    await axios(config);
  } catch (error) {
    console.error("Failed to update ticket:", error);
  }
}

// Middleware to store raw body for signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.get("/api/tickets/:ticket_id", (req, res) => {
  const ticket_id = req.params.ticket_id;

  fetchTicketClassification(ticket_id, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving data" });
    }
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "Ticket not found" });
    }
  });
});

// Webhook endpoint for ticket classification
app.post("/webhook/classify_tickets", async (req, res) => {
  const signature = req.headers["x-zendesk-webhook-signature"];
  const timestamp = req.headers["x-zendesk-webhook-timestamp"]; // Ensure this header is being sent by Zendesk
  const body = req.rawBody;

  // Verify webhook signature
 // if (!isValidSignature(signature, body, timestamp)) {
 //   return res.status(401).send("Invalid webhook signature.");
 // }

  // Assuming ticket_id and ticket_comment are sent in the POST request body
  const { ticket_id, ticket_comment } = req.body;
  if (!ticket_id || !ticket_comment) {
    return res.status(400).send("Missing ticket information.");
  }

  // Classify the ticket comment
  const classification = await classifyTicket(ticket_id, ticket_comment);
  
  if (!classification) {
    return res.status(500).send("Error processing ticket.");
  }

  // Update the Zendesk ticket with the classification
  updateZendeskTicket(ticket_id, classification);

  res.status(200).json({ message: "Ticket processed", classification });
});

async function startServer() {
  await initializeDatabase();
  await getTicketFields();
  app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
  });
}

startServer();

module.exports = app;