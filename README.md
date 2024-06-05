# Zendesk Ticket Classifier

This project integrates the Zendesk ticketing system with OpenAI's language models to automatically classify tickets based on their content. This automation helps streamline ticket triage and improve response times.

## Features

- **Ticket Classification**: Leverages OpenAI to analyze and categorize ticket content, facilitating faster issue resolution.
- **Database Integration**: Utilizes SQLite to store and manage ticket data and classifications, enhancing data accessibility and security.
- **Automated Ticket Updates**: Automatically updates ticket statuses and tags in Zendesk based on classification results, ensuring accurate ticket tracking.

## Prerequisites

- Node.js (v18.12.0 or higher)
- npm (or yarn)
- Access to Zendesk API with a valid API key
- Access to OpenAI API with a valid API key
- A Zendesk Dropdown Ticket Field with predefined 'categories' relevant to your workflow

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/askstylo/zendesk_ticket_classifier.git
   cd zendesk_ticket_classifier
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Copy the `env.example` file to a new file named `.env` and fill in the necessary details:
   ```plaintext
   ZD_SUBDOMAIN=your_subdomain_here
   ZD_EMAIL=your_zendesk_email_here
   ZD_API_KEY=your_zendesk_api_key_here
   ZENDESK_FIELD_ID=your_field_id_here
   ZD_AUTH=your_base64_encoded_auth_here
   OPENAI_API_KEY=your_openai_api_key_here
   DB_PATH=./zendeskTickets.db
   ```

## Usage

To use this application, start the server and send webhook requests from your Zendesk account:

1. **Start the Server**

   ```bash
   npm start
   ```

2. **Send a Webhook Request**
   Format the body of the request as follows and send to the provided endpoint:

   ```json
   {
     "ticket_id": "{{ticket.id}}",
     "ticket_subject": "{{ticket.subject}}",
     "ticket_comment": "{{ticket.latest_public_comment_html}}"
   }
   ```

3. **Review Classification Results**
   After classification, the ticket is updated with the determined category or tagged for manual review if no suitable category is found.

## API Endpoints

- `GET /api/tickets/:ticket_id`: Returns classification details for a specific ticket.
- `POST /webhook/classify_tickets`: Endpoint to receive ticket classification requests.

## Testing with Curl

To test the API endpoints manually, first disable signature checks in `app.js`, then use the following commands:

### GET a summary of a ticket classification

```bash
curl -X GET "http://localhost:3000/api/tickets/{ticket_id}" -H "Content-Type: application/json"
```

### POST a classification request

```bash
curl -X POST "http://localhost:3000/webhook/classify_tickets" -H "Content-Type: application/json" -H "x-zendesk-webhook-signature: {your_signature}" -H "x-zendesk-webhook-signature-timestamp: {your_timestamp}" -d '{"ticket_id": "123", "ticket_comment": "Please check this issue"}'
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
