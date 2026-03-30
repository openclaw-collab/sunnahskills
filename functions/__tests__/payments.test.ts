/**
 * Payment Endpoint Tests
 * Tests for create-intent, create-subscription, and webhook endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
let currentStripeMock: any;

vi.mock("stripe", () => ({
  default: vi.fn(function StripeMock() {
    return currentStripeMock;
  }),
}));

import { onRequestPost as createIntentHandler } from "../api/payments/create-intent";
import { onRequestPost as createSubscriptionHandler } from "../api/payments/create-subscription";
import { onRequestPost as webhookHandler } from "../api/payments/webhook";
import { onRequestPost as reconcileOrderHandler } from "../api/payments/reconcile-order";
import { issuePaymentReconcileToken } from "../_utils/paymentReconcileToken";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";
import Stripe from "stripe";
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
        update: vi.fn().mockResolvedValue({ id: "cus_test123" }),
      },
      coupons: {
        retrieve: vi.fn().mockRejectedValue(new Error("Not found")),
        create: vi.fn().mockResolvedValue({ id: "coupon_test" }),
      },
      subscriptions: {
        create: vi.fn().mockResolvedValue({
          id: "sub_test123",
          latest_invoice: {
            subtotal: 10000,
            currency: "cad",
            total_discount_amounts: [],
            payment_intent: {
              id: "pi_test123",
              client_secret: "pi_test123_secret",
              amount: 10000,
              currency: "cad",
            },
          },
        }),
      },
      paymentIntents: {
        retrieve: vi.fn(),
      },
    };
    currentStripeMock = mockStripe;

    vi.mocked(Stripe).mockImplementation(function StripeMock() {
      return mockStripe as any;
    } as any);
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

    const baseRegRow = (patch: Record<string, unknown> = {}) => ({
      id: 1,
      program_id: "bjj",
      price_id: 1,
      amount: 10000,
      registration_fee: 5000,
      frequency: null as string | null,
      price_metadata: null as string | null,
      program_specific_data: JSON.stringify({ bjjTrack: "men-14" }),
      ...patch,
    });

    it("should return 400 if registration has no price", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        { id: 1, program_id: "bjj", price_id: null, amount: null, program_specific_data: "{}" },
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
      mockDb.setMockData("registrations", [baseRegRow()]);

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
      mockDb.setMockData("registrations", [baseRegRow()]);

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
        baseRegRow({ program_specific_data: JSON.stringify({ bjjTrack: "boys-7-13" }) }),
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

      // 13 default scheduled classes * 10000 per class + 5000 reg fee = 135000.
      // 10% sibling discount applies to eligible kids lines after subtotal.
      expect(amount).toBe("121500");
    });

    it("should apply discount code", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [baseRegRow()]);
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

      // 13 default scheduled classes * 10000 per class + 5000 reg fee = 135000.
      // 20% promo applies before sibling math. With no sibling discount here, total is 108000.
      expect(amount).toBe("108000");
    });

    it("should apply fixed discount code before sibling discount", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        baseRegRow({ program_specific_data: JSON.stringify({ bjjTrack: "boys-7-13" }) }),
      ]);
      mockDb.setMockData("discounts", [
        {
          code: "ONCEAWEEK",
          type: "fixed",
          value: 10000,
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
        body: { registrationId: 1, siblingCount: 1, discountCode: "ONCEAWEEK" },
      });

      await createIntentHandler({ request, env });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = new URLSearchParams(fetchCall[1]?.body as string);
      const amount = body.get("amount");

      // 13 default scheduled classes * 10000 per class + 5000 reg fee = 135000.
      // Fixed promo first: 135000 - 10000 = 125000.
      // Sibling then applies to the reduced amount: 125000 - 12500 = 112500.
      expect(amount).toBe("112500");
    });

    it("should handle Stripe API error", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [baseRegRow()]);

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
      mockDb.setMockData("registrations", [baseRegRow()]);

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
          program_id: "bjj",
          price_id: 1,
          amount: 10000,
          guardian_email: "test@example.com",
          guardian_name: "Test User",
          program_specific_data: JSON.stringify({ bjjTrack: "men-14" }),
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
          program_id: "bjj",
          price_id: 1,
          amount: 10000,
          guardian_email: "test@example.com",
          guardian_name: "Test User",
          program_specific_data: JSON.stringify({ bjjTrack: "boys-7-13" }),
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
          program_id: "bjj",
          price_id: 1,
          amount: 10000,
          guardian_email: "test@example.com",
          guardian_name: "Test User",
          program_specific_data: JSON.stringify({ bjjTrack: "boys-7-13" }),
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
          program_id: "bjj",
          price_id: 1,
          amount: 10000,
          guardian_email: "test@example.com",
          guardian_name: "Test User",
          program_specific_data: JSON.stringify({ bjjTrack: "men-14" }),
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

      const request = new Request("https://example.com/api/payments/webhook", {
        method: "POST",
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

      const request = new Request("https://example.com/api/payments/webhook", {
        method: "POST",
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

      const request = new Request("https://example.com/api/payments/webhook", {
        method: "POST",
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

      const request = new Request("https://example.com/api/payments/webhook", {
        method: "POST",
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

      const request = new Request("https://example.com/api/payments/webhook", {
        method: "POST",
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

      const request = new Request("https://example.com/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "valid-sig" },
        body: "test-payload",
      });

      await webhookHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE program_sessions SET enrolled_count = enrolled_count + 1")
      );
    });
  });

  describe("POST /api/payments/reconcile-order", () => {
    it("returns 400 when enrollmentOrderId is missing", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/reconcile-order", {
        body: {},
      });

      const response = await reconcileOrderHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("enrollmentOrderId is required");
    });

    it("returns 401 when reconcileToken is missing", async () => {
      const request = createMockRequest("POST", "https://example.com/api/payments/reconcile-order", {
        body: { enrollmentOrderId: 34 },
      });

      const response = await reconcileOrderHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("reconcileToken is required");
    });

    it("returns order state when the PaymentIntent has not succeeded", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("enrollment_orders", [
        { id: 34, status: "pending_payment", stripe_payment_intent_id: "pi_pending" },
      ]);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_pending",
        status: "requires_payment_method",
        metadata: { enrollment_order_id: "34" },
      });

      const reconcileToken = await issuePaymentReconcileToken(env, {
        enrollmentOrderId: 34,
        paymentIntentId: "pi_pending",
      });
      const request = createMockRequest("POST", "https://example.com/api/payments/reconcile-order", {
        body: { enrollmentOrderId: 34, reconcileToken },
      });

      const response = await reconcileOrderHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(false);
      expect(data.paymentStatus).toBe("requires_payment_method");
      expect(data.orderStatus).toBe("pending_payment");
    });

    it("reconciles a succeeded PaymentIntent into a paid order", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("enrollment_orders", [
        { id: 34, status: "pending_payment", stripe_payment_intent_id: "pi_paid", later_amount_cents: 0 },
      ]);
      mockDb.setMockData("payments", [
        {
          id: 34,
          status: "pending",
          registration_id: 81,
          stripe_payment_intent_id: "pi_paid",
          metadata: JSON.stringify({
            enrollmentOrderId: 34,
            registrationIds: [81, 82],
            payPhase: "first",
          }),
          session_id: 5,
        },
      ]);
      mockDb.setMockData("registrations", [
        { id: 81, session_id: 5, enrollment_order_id: 34 },
        { id: 82, session_id: 5, enrollment_order_id: 34 },
      ]);
      mockDb.setMockData("guardians", [{ id: 1, full_name: "Inas", email: "inas@example.com" }]);
      mockDb.setMockData("students", [{ id: 1, full_name: "Student One" }]);
      mockDb.setMockData("programs", [{ id: 1, name: "Brazilian Jiu-Jitsu" }]);

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: "pi_paid",
        status: "succeeded",
        metadata: {
          enrollment_order_id: "34",
          registration_ids: "81,82",
          pay_phase: "first",
        },
        charges: { data: [{ receipt_url: "https://receipt.stripe.com/paid" }] },
        amount_received: 59280,
        currency: "cad",
        customer: "cus_test123",
        payment_method: "pm_test123",
      });

      const reconcileToken = await issuePaymentReconcileToken(env, {
        enrollmentOrderId: 34,
        paymentIntentId: "pi_paid",
      });
      const request = createMockRequest("POST", "https://example.com/api/payments/reconcile-order", {
        body: { enrollmentOrderId: 34, reconcileToken },
      });

      const response = await reconcileOrderHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.reconciled).toBe(true);
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith("pi_paid", {
        expand: ["charges.data", "payment_method"],
      });
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE enrollment_orders")
      );
    });
  });
});
