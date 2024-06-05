const sqlite3 = require("sqlite3").verbose();

function initializeDatabase() {
  const db = new sqlite3.Database(
    "./zendeskTickets.db",
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error("Error when connecting to the database", err);
        return;
      }
      console.log("Connected to the database.");
      createTables(db);
    }
  );
}

function createTables(db) {
  const createTicketClassificationsTable = `
    CREATE TABLE IF NOT EXISTS ticket_classifications (
      ticket_id INTEGER PRIMARY KEY,
      classification TEXT NOT NULL,
      summary TEXT
    );`;

  const createTicketFieldsTable = `
    CREATE TABLE IF NOT EXISTS ticket_fields (
      field_id INTEGER PRIMARY KEY,
      field_values TEXT NOT NULL
    );`;

  db.serialize(() => {
    db.run(createTicketClassificationsTable, (err) => {
      if (err) {
        console.error("Error creating ticket_classifications table", err);
      } else {
        console.log("Ticket classifications table created or already exists.");
      }
    });

    db.run(createTicketFieldsTable, (err) => {
      if (err) {
        console.error("Error creating ticket_fields table", err);
      } else {
        console.log("Ticket fields table created or already exists.");
      }
    });

    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error("Error closing the database", err);
      } else {
        console.log("Database connection closed.");
      }
    });
  });
}

module.exports = {
  initializeDatabase,
};
