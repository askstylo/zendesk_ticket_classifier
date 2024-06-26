const request = require('supertest');
const app = require('../app');
const axios = require('axios');
const crypto = require('crypto');
const { initializeDatabase } = require('../../scripts/dbSetup');
const { getTicketFields } = require('../helpers/fetchAndStoreTicketField');

jest.mock('axios');
jest.mock('../../scripts/dbSetup');
jest.mock('../helpers/fetchAndStoreTicketField');

beforeAll(() => {
  // Initialize database might be mocked if it interacts with real DB during testing
  initializeDatabase.mockImplementation(() => Promise.resolve());
  getTicketFields.mockImplementation(() => Promise.resolve());
});

describe("API endpoints", () => {
  describe("GET /api/tickets/:ticket_id", () => {
    it("should return ticket data if found", async () => {
      const mockData = { ticket_id: 123, classification: "Technical Issue", summary: "Issue related to technical error." };
      jest.spyOn(require('../helpers/fetchTicketClassification'), 'fetchTicketClassification').mockImplementation((ticket_id, callback) => {
        callback(null, mockData);
      });

      const response = await request(app)
        .get('/api/tickets/123')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual(mockData);
    });

    it("should return 404 if no ticket is found", async () => {
      jest.spyOn(require('../helpers/fetchTicketClassification'), 'fetchTicketClassification').mockImplementation((ticket_id, callback) => {
        callback(null, mockData);
      });
      
      await request(app)
        .get('/api/tickets/999')
        .expect(404);
    });
  });

  describe("POST /api/webhook/classify_tickets", () => {
    it("rejects requests with invalid signature", async () => {
      await request(app)
        .post('/api/webhook/classify_tickets')
        .send({ ticket_id: "123", ticket_comment: "Please check my issue" })
        .expect(401);
    });

    it("processes valid requests and updates ticket", async () => {
      const validSignature = 'valid_signature';
      const body = JSON.stringify({ ticket_id: "123", ticket_comment: "Please check my issue" });

      // Mock signature verification to always return true
      jest.spyOn(crypto, 'createHmac').mockImplementation(() => ({
        update: () => ({
          digest: () => validSignature
        })
      }));

      axios.put.mockResolvedValue({ data: { success: true } });

      await request(app)
        .post('/api/webhook/classify_tickets')
        .set('x-zendesk-webhook-signature', validSignature)
        .set('x-zendesk-webhook-signature-timestamp', new Date().toISOString())
        .send(body)
        .expect(200);
        
      expect(axios.put).toHaveBeenCalled();
    });
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});
