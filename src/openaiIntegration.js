require("dotenv").config();
const OpenAIApi = require("openai");
const sqlite3 = require("sqlite3").verbose();

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });

let cache = {};

async function classifyTicket(ticket_id, ticket_comment) {
  const db = new sqlite3.Database("fetchAndStoreTicketFields");
  const ticketFieldId = process.env.ZENDESK_FIELD_ID;
  const cacheKey = `ticket_fields_${ticketFieldId}`;

  // Fetch ticket fields from cache or database
  let categories = [];
  if (
    cache[cacheKey] &&
    Date.now() - cache[cacheKey].timestamp < 12 * 60 * 60 * 1000
  ) {
    categories = cache[cacheKey].data;
  } else {
    categories = await fetchTicketField(db, ticketFieldId);
    cache[cacheKey] = { data: fields, timestamp: Date.now() };
  }

  const messages = [
    {
      role: "user",
      content:
        "Your task is to classify the ticket comment sent in the next message into predefined categories. You will then provide the classification and a summary of the reasoning. If none of the categories closely match, then the 'unknown'",
    },
    {
      role: "user",
      content: `Please classify the following ticket comment: "${ticket_comment}", using one of the following categories: "${categories}"`,
    },
  ];
  const tools = [
    {
      type: "function",
      function: {
        name: "classify_comment",
        description:
          "Takes the output of a ticket classification model and returns the category and summary of the classification reasoning.",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description:
                "A single sentence summary of the classification reasoning",
            },
            category: {
              type: "string",
              description:
                "The ticket category that most closely matches the comment",
            },
          },
          required: ["summary", "category"],
        },
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
  });

  const responseMessage = response.choices[0].message;

  // Check if a function was called and handle the response
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    // find classify_comment function
    const toolCall = responseMessage.tool_calls.find(
      (tool) => tool.function.name === "classify_comment"
    );
    if (!toolCall) {
      return {
        ticket_id: ticket_id,
        category: "unknown",
        summary: "OpenAI did not call the classification function.",
      };
    }
    const result = JSON.parse(toolCall.function.arguments);

    // Store the classification in the database
    const insertQuery = `INSERT OR REPLACE INTO ticket_classifications (ticket_id, classification, summary) VALUES (?, ?, ?)`;
    db.run(insertQuery, [ticket_id, result.category, result.summary], (err) => {
      if (err) {
        console.error("Error inserting classification data:", err);
      }
    });
    return {
      ticket_id: ticket_id,
      category: result.category,
      summary: result.summary,
    };
  }
}

async function fetchTicketField(db, ticketFieldId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT field_values FROM ticket_fields WHERE field_id = ?`;
    db.get(query, [ticketFieldId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? [row] : []);
      }
    });
  });
}

module.exports = { classifyTicket };
