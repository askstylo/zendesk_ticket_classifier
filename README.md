
# Zendesk Ticket Classifier

This project is designed to demonstrate the integration of Zendesk ticketing system with OpenAI's powerful language models to classify and update a ticket field automatically based on their content. Which in turn allows for you to automatically triage tickets.

## Features

- **Ticket Classification**: Automatically classifies tickets using OpenAI based on the content of the ticket comments.
- **Database Integration**: Uses SQLite to manage ticket data and classifications locally.
- **Automated Ticket Updates**: Automatically updates ticket status and tags in Zendesk based on classification results.

## Prerequisites

- Node.js (v18.12.0 or higher)
- npm (or yarn)
- Access to Zendesk API with a valid API key
- Access to OpenAI API with a valid API key
- A Zendesk Dropdown Ticket Field with 'categories' set up that you find useful to your use case. An example of e-commerce categories can be found in `example-categories.csv`

## Installation

1. **Clone the Repository**
   ```bash
   https://github.com/askstylo/zendesk_ticket_classifier.git
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

## Spin up your own copy on Glitch
1. [Remix your own copy](https://glitch.com/edit/#!/remix/silver-pointed-delivery)
2. Copy the env.example into a env file and fill out all the values
3. You're good to go!


- **Starting the Server**
  ```bash
  npm start
  ```

- **Send a webhook request from your Zendesk account** 
The body should be formatted such as this:

```
{
    "ticket_id": "{{ticket.id}}",
    "ticket_subject": "{{ticket.subject}}
    "ticket_comment": "{{ticket.latest_public_comment_html}}"
}

```

2. The application will analyse the ticket, and choose the category from the available values in the ticket field you set up. It will then set the field according to that value
3. If a category couldn't be found that encapsulates the ticket comment, it will tag the ticket with `human_triage_required` to allow for your team to handle accordingly.
4. If you would like to dig into why a category was selected, you can hit the `/api/tickets/{ticket_id}` endpoint with the corresponding ticket_id to see a summary of the classification.

  ```

## API Endpoints

- `GET /api/tickets/:ticket_id`: Fetches the classification details for a given ticket.
- `POST /webhook/classify_tickets`: Receives webhook calls for ticket classification.

## Testing with Curl

To manually test your API endpoints using curl comment out the below code found in `app.js`

```
  if (!isValidSignature(signature, body, timestamp)) {
    return res.status(401).send("Invalid webhook signature.");
  }
```

### GET a summary of why a ticket was given a particular category.
```bash
curl -X GET "http://localhost:3000/api/tickets/{ticket_id}" -H "Content-Type: application/json"
```

### POST Webhook for Ticket Classification
```bash
curl -X POST "http://localhost:3000/webhook/classify_tickets" \
-H "Content-Type: application/json" \
-H "x-zendesk-webhook-signature: {your_signature}" \
-H "x-zendesk-webhook-signature-timestamp: {your_timestamp}" \
-d '{"ticket_id": "123", "ticket_comment": "Please check this issue"}'
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
