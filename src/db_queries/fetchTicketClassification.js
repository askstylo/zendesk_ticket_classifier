const sqlite3 = require('sqlite3').verbose();

function fetchTicketClassification(ticket_id, callback) {
  const db = new sqlite3.Database('./zendeskTickets.db', (err) => {
    if (err) {
      console.error('Error opening database:', err);
      callback(err, null);
      return;
    }
  });

  db.get('SELECT ticket_id, classification, summary FROM ticket_classifications WHERE ticket_id = ?', [ticket_id], (err, row) => {
    if (err) {
      console.error('Error fetching data:', err);
      callback(err, null);
    } else {
      callback(null, row);
    }
  });

  db.close((err) => {
    if (err) {
      console.error('Error closing the database connection:', err);
    }
  });
}

module.exports = { fetchTicketClassification };
