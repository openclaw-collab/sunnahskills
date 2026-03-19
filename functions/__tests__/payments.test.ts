/**
 * Payment Endpoint Tests
 * Tests for create-intent, create-subscription, and webhook endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestPost as createIntentHandler } from "../api/payments/create-intent";
import { onRequestPost as createSubscriptionHandler } from "../api/payments/create-subscription";
import { onRequestPost as webhookHandler } from "../api/payments/webhook";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";
import Stripe from "stripe";

vi.mock("stripe");
vi.mock("../_utils/email", () => ({
  sendMailChannelsEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock("../_utils/emailTemplates", () => ({
  paymentReceiptEmail: vi.fn().mockReturnValue({
    subject: "Payment received",
    text: "Receipt text",
    html: "<p>Receipt html</p>",
  }),
  adminPaymentReceivedEmail: vi.fn().mockReturnValue({
    subject: "Payment received",
    text: "Admin receipt text",
    html: "<p>Admin receipt html</p>",
  }),
}));

describe("Payment Endpoints", () => {
  let env: ReturnType<typeof createMockEnv>;
  let mockStripe: any;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();

    mockStripe = {
      webhooks: {
        constructEvent: vi.fn(),
      },
      customers: {
        list: vi.fn().mockResolvedValue({ data: [] }),
        create: vi.fn().mockResolvedValue({ id: "cus_test123" }),
      },
      coupons: {
        retrieve: vi.fn().mockRejectedValue(new Error("Not found")),
        create: vi.fn().mockResolvedValue({ id: "coupon_test" }),
      },
      subscriptions: {
        create: vi.fn().mockResolvedValue({
          id: "sub_test123",
          latest_invoice: {
            payment_intent: {
              id: "pi_test123",
              client_secret: "pi_test123_secret",
            },
          },
        }),
      },
    };

    vi.mocked(Stripe).mockImplementation(() => mockStripe);
  });

  describe("POST /api/payments/create-intent", () => {
    it("should return 400 if registrationId is missing", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: {},
      });

      const response = await createIntentHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("registrationId is required");
    });

    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1 },
      });

      const response = await createIntentHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 404 if registration not found", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 999 },
      });

      const response = await createIntentHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Registration not found");
    });

    it("should return 400 if registration has no price", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: null, amount: null },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1 },
      });

      const response = await createIntentHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Registration has no price selected");
    });

    it("should return 500 if Stripe is not configured", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: 1, amount: 10000, registration_fee: 5000 },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1 },
      });

      const response = await createIntentHandler({
        request,
        env: { ...env, STRIPE_SECRET_KEY: undefined },
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("Stripe not configured");
    });

    it("should create payment intent successfully", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: 1, amount: 10000, registration_fee: 5000 },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: "pi_test123",
          client_secret: "pi_test123_secret",
        }),
      });

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1 },
      });

      const response = await createIntentHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.clientSecret).toBe("pi_test123_secret");
      expect(data.paymentIntentId).toBe("pi_test123");
    });

    it("should apply sibling discount", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: 1, amount: 10000, registration_fee: 5000 },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: "pi_test123",
          client_secret: "pi_test123_secret",
        }),
      });

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1, siblingCount: 1 },
      });

      await createIntentHandler({ request, env });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = new URLSearchParams(fetchCall[1]?.body as string);
      const amount = body.get("amount");

      // Subtotal: 10000 + 5000 = 15000, 10% discount = 1500, Total: 13500
      expect(amount).toBe("13500");
    });

    it("should apply discount code", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: 1, amount: 10000, registration_fee: 5000 },
      ]);
      mockDb.setMockData("discounts", [
        {
          code: "SAVE20",
          type: "percentage",
          value: 20,
          program_id: null,
          max_uses: 100,
          current_uses: 0,
          valid_from: null,
          valid_until: null,
          active: 1,
        },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: "pi_test123",
          client_secret: "pi_test123_secret",
        }),
      });

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1, discountCode: "SAVE20" },
      });

      await createIntentHandler({ request, env });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = new URLSearchParams(fetchCall[1]?.body as string);
      const amount = body.get("amount");

      // Subtotal: 15000, 20% discount = 3000, Total: 12000
      expect(amount).toBe("12000");
    });

    it("should handle Stripe API error", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: 1, amount: 10000, registration_fee: 5000 },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: { message: "Card declined" } }),
      });

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1 },
      });

      const response = await createIntentHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(502);
      expect(data.error).toBe("Stripe error creating PaymentIntent");
    });

    it("should update registration status to pending_payment", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: 1, amount: 10000, registration_fee: 5000 },
      ]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: "pi_test123",
          client_secret: "pi_test123_secret",
        }),
      });

      const request = createMockRequest("POST", "https://example.com/api/payments/create-intent", {
        body: { registrationId: 1 },
      });

      await createIntentHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE registrations SET status = 'pending_payment'")
      );
    });
  });

  describe("POST /api/payments/create-subscription", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: { registrationId: 1, guardianEmail: "test@example.com", guardianName: "Test User" },
      });

      const response = await createSubscriptionHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 200 with fallback if Stripe not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: { registrationId: 1, guardianEmail: "test@example.com", guardianName: "Test User" },
      });

      const response = await createSubscriptionHandler({
        request,
        env: { ...env, STRIPE_SECRET_KEY: undefined },
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.error).toBe("subscriptions_not_configured");
    });

    it("should return 400 if registrationId is missing", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: { guardianEmail: "test@example.com", guardianName: "Test User" },
      });

      const response = await createSubscriptionHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("registrationId is required");
    });

    it("should return 404 if registration not found", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: { registrationId: 999, guardianEmail: "test@example.com", guardianName: "Test User" },
      });

      const response = await createSubscriptionHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Registration not found");
    });

    it("should return 200 with fallback if no Stripe Price ID configured", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: 1, price_id: 1, amount: 10000, price_metadata: "{}" },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: { registrationId: 1, guardianEmail: "test@example.com", guardianName: "Test User" },
      });

      const response = await createSubscriptionHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.error).toBe("subscriptions_not_configured");
    });

    it("should create subscription successfully", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        {
          id: 1,
          program_id: 1,
          price_id: 1,
          amount: 10000,
          price_metadata: JSON.stringify({ stripe_price_id: "price_test123" }),
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: { registrationId: 1, guardianEmail: "test@example.com", guardianName: "Test User" },
      });

      const response = await createSubscriptionHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.clientSecret).toBe("pi_test123_secret");
      expect(data.subscriptionId).toBe("sub_test123");
    });

    it("should apply sibling discount coupon", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        {
          id: 1,
          program_id: 1,
          price_id: 1,
          amount: 10000,
          price_metadata: JSON.stringify({ stripe_price_id: "price_test123" }),
        },
      ]);

      mockStripe.coupons.retrieve = vi.fn().mockResolvedValue({ id: "sibling-10pct" });

      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: {
          registrationId: 1,
          guardianEmail: "test@example.com",
          guardianName: "Test User",
          siblingCount: 1,
        },
      });

      await createSubscriptionHandler({ request, env });

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discounts: [{ coupon: "sibling-10pct" }],
        })
      );
    });

    it("should create sibling coupon if it doesn't exist", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        {
          id: 1,
          program_id: 1,
          price_id: 1,
          amount: 10000,
          price_metadata: JSON.stringify({ stripe_price_id: "price_test123" }),
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: {
          registrationId: 1,
          guardianEmail: "test@example.com",
          guardianName: "Test User",
          siblingCount: 1,
        },
      });

      await createSubscriptionHandler({ request, env });

      expect(mockStripe.coupons.create).toHaveBeenCalledWith({
        id: "sibling-10pct",
        percent_off: 10,
        duration: "forever",
        name: "Sibling Discount (10%)",
      });
    });

    it("should reuse existing customer if found", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        {
          id: 1,
          program_id: 1,
          price_id: 1,
          amount: 10000,
          price_metadata: JSON.stringify({ stripe_price_id: "price_test123" }),
        },
      ]);

      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: "cus_existing", email: "test@example.com" }],
      });

      const request = createMockRequest("POST", "https://example.com/api/payments/create-subscription", {
        body: { registrationId: 1, guardianEmail: "test@example.com", guardianName: "Test User" },
      });

      await createSubscriptionHandler({ request, env });

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_existing",
        })
      );
    });
  });

  describe("POST /api/payments/webhook", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/webhook");

      const response = await webhookHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 500 if Stripe webhook not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/webhook");

      const response = await webhookHandler({
        request,
        env: { ...env, STRIPE_WEBHOOK_SECRET: undefined },
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("Stripe webhook not configured");
    });

    it("should return 400 if stripe-signature header is missing", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/webhook");

      const response = await webhookHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing stripe-signature header");
    });

    it("should return 400 for invalid signature", async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const request = createMockRequest("POST", "https://example.com/api/payments/webhook", {
        headers: { "stripe-signature": "invalid-sig" },
        body: "test-payload",
      });

      const response = await webhookHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid signature");
    });

    it("should handle payment_intent.succeeded event", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test123",
            metadata: { registration_id: "1" },
            amount_received: 15000,
            currency: "usd",
            charges: {
              data: [{ receipt_url: "https://receipt.stripe.com/test" }],
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [{ id: 1, session_id: 1 }]);

      const request = createMockRequest("POST", "https://example.com/api/payments/webhook", {
        headers: { "stripe-signature": "valid-sig" },
        body: "test-payload",
      });

      const response = await webhookHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should handle payment_intent.payment_failed event", async () => {
      const mockEvent = {
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test123",
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest("POST", "https://example.com/api/payments/webhook", {
        headers: { "stripe-signature": "valid-sig" },
        body: "test-payload",
      });

      const response = await webhookHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should handle invoice.paid event for subscriptions", async () => {
      const mockEvent = {
        type: "invoice.paid",
        data: {
          object: {
            subscription: "sub_test123",
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = createMockRequest("POST", "https://example.com/api/payments/webhook", {
        headers: { "stripe-signature": "valid-sig" },
        body: "test-payload",
      });

      const response = await webhookHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should update payment status on successful payment", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test123",
            metadata: { registration_id: "1" },
            amount_received: 15000,
            currency: "usd",
            charges: {
              data: [{ receipt_url: "https://receipt.stripe.com/test" }],
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [{ id: 1, session_id: 1 }]);

      const request = createMockRequest("POST", "https://example.com/api/payments/webhook", {
        headers: { "stripe-signature": "valid-sig" },
        body: "test-payload",
      });

      await webhookHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE payments SET status='paid'")
      );
    });

    it("should update registration status to active on successful payment", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test123",
            metadata: { registration_id: "1" },
            amount_received: 15000,
            currency: "usd",
            charges: {
              data: [{ receipt_url: "https://receipt.stripe.com/test" }],
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [{ id: 1, session_id: 1 }]);

      const request = createMockRequest("POST", "https://example.com/api/payments/webhook", {
        headers: { "stripe-signature": "valid-sig" },
        body: "test-payload",
      });

      await webhookHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE registrations SET status='active'")
      );
    });

    it("should increment enrolled_count on successful payment with session", async () => {
      const mockEvent = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test123",
            metadata: { registration_id: "1" },
            amount_received: 15000,
            currency: "usd",
            charges: {
              data: [{ receipt_url: "https://receipt.stripe.com/test" }],
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [{ id: 1, session_id: 1 }]);

      const request = createMockRequest("POST", "https://example.com/api/payments/webhook", {
        headers: { "stripe-signature": "valid-sig" },
        body: "test-payload",
      });

      await webhookHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE program_sessions SET enrolled_count = enrolled_count + 1")
      );
    });
  });
});
