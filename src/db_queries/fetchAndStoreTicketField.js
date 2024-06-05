require('dotenv').config();
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const ticketFieldId = process.env.ZENDESK_FIELD_ID;

let cachedTicketFields = null;
let cacheTimestamp = null;

const fetchTicketFieldsFromAPI = async () => {
  const config = {
    method: 'get',
    url: `https://${process.env.ZD_SUBDOMAIN}.zendesk.com/api/v2/ticket_fields/${ticketFieldId}/options`,
    headers: {
      'Authorization': `Basic ${process.env.ZD_AUTH}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await axios(config);
    return response.data.custom_field_options.map(option => option.value);  // Return only values as an array
  } catch (error) {
    console.error('Failed to fetch ticket fields from API:', error);
    return [];
  }
};

const fetchAndStoreTicketFields = async () => {
  const db = new sqlite3.Database('./zendeskTickets.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error('Error opening database:', err);
  });

  // Ensure the table exists and is designed to store JSON serialized data
  db.run(`CREATE TABLE IF NOT EXISTS ticket_fields (field_id INTEGER PRIMARY KEY, field_values TEXT NOT NULL)`, err => {
    if (err) console.error('Error creating table:', err);
  });

  const categories = await fetchTicketFieldsFromAPI();


  if (categories.length > 0) {
    const categoriesSerialized = JSON.stringify(categories);
    const insertQuery = `INSERT OR REPLACE INTO ticket_fields (field_id, field_values) VALUES (?, ?)`;

    // Using a fixed ID for simplicity; adjust as necessary for multiple fields
    db.run(insertQuery, [ticketFieldId, categoriesSerialized], (err) => {
      if (err) {
        console.error('Error inserting field data:', err);
      }
    });

    // Update the cache
    cachedTicketFields = categories;
    cacheTimestamp = Date.now();
  }

  db.close();
};

const getTicketFields = async () => {
  // Check if cached ticket fields are still valid (not expired)
  if (cachedTicketFields && cacheTimestamp && Date.now() - cacheTimestamp < 12 * 60 * 60 * 1000) {
    return cachedTicketFields;
  } else {
    // Fetch ticket fields from API and update cache
    await fetchAndStoreTicketFields();
    return cachedTicketFields;
  }
};

module.exports = {
  getTicketFields
};
