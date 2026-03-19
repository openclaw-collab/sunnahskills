/**
 * Other Endpoint Tests
 * Tests for programs, contact, waitlist, and discount validation endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestGet as programsHandler } from "../api/programs";
import { onRequestPost as contactPostHandler, onRequestGet as contactGetHandler } from "../api/contact";
import { onRequestPost as waitlistHandler } from "../api/waitlist";
import { onRequestPost as validateDiscountHandler } from "../api/discounts/validate";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("../_utils/email", () => ({
  sendMailChannelsEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("../_utils/emailTemplates", () => ({
  waitlistConfirmationEmail: vi.fn().mockReturnValue({
    subject: "Waitlist confirmation",
    text: "You're on the waitlist",
    html: "<p>You're on the waitlist</p>",
  }),
  adminNewRegistrationEmail: vi.fn().mockReturnValue({
    subject: "New waitlist entry",
    text: "New waitlist entry",
    html: "<p>New waitlist entry</p>",
  }),
}));

describe("Other Endpoints", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe("GET /api/programs", () => {
    it("should return 500 if DB is not configured", async () => {
      const response = await programsHandler({
        request: new Request("https://example.com/api/programs"),
        env: { DB: null as any },
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return programs with sessions and prices", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [
        { id: 1, name: "BJJ", slug: "bjj", status: "active" },
        { id: 2, name: "Archery", slug: "archery", status: "active" },
      ]);
      mockDb.setMockData("program_sessions", [
        { id: 1, program_id: 1, name: "Session 1", visible: 1 },
        { id: 2, program_id: 1, name: "Session 2", visible: 1 },
        { id: 3, program_id: 2, name: "Session 3", visible: 1 },
      ]);
      mockDb.setMockData("program_prices", [
        { id: 1, program_id: 1, amount: 10000, frequency: "monthly", active: 1 },
        { id: 2, program_id: 1, amount: 25000, frequency: "quarterly", active: 1 },
      ]);

      const response = await programsHandler({
        request: new Request("https://example.com/api/programs"),
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.programs).toHaveLength(2);

      const bjjProgram = data.programs.find((p: any) => p.slug === "bjj");
      expect(bjjProgram.sessions).toHaveLength(2);
      expect(bjjProgram.prices).toHaveLength(2);
    });

    it("should not include archived programs", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [
        { id: 1, name: "BJJ", slug: "bjj", status: "active" },
        { id: 2, name: "Old Program", slug: "old", status: "archived" },
      ]);
      mockDb.setMockData("program_sessions", []);
      mockDb.setMockData("program_prices", []);

      const response = await programsHandler({
        request: new Request("https://example.com/api/programs"),
        env,
      });
      const data = await parseJsonResponse(response);

      expect(data.programs).toHaveLength(1);
      expect(data.programs[0].slug).toBe("bjj");
    });

    it("should only include visible sessions", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [
        { id: 1, name: "BJJ", slug: "bjj", status: "active" },
      ]);
      mockDb.setMockData("program_sessions", [
        { id: 1, program_id: 1, name: "Visible Session", visible: 1 },
        { id: 2, program_id: 1, name: "Hidden Session", visible: 0 },
      ]);
      mockDb.setMockData("program_prices", []);

      const response = await programsHandler({
        request: new Request("https://example.com/api/programs"),
        env,
      });
      const data = await parseJsonResponse(response);

      expect(data.programs[0].sessions).toHaveLength(1);
      expect(data.programs[0].sessions[0].name).toBe("Visible Session");
    });

    it("should only include active prices", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [
        { id: 1, name: "BJJ", slug: "bjj", status: "active" },
      ]);
      mockDb.setMockData("program_sessions", []);
      mockDb.setMockData("program_prices", [
        { id: 1, program_id: 1, amount: 10000, frequency: "monthly", active: 1 },
        { id: 2, program_id: 1, amount: 25000, frequency: "quarterly", active: 0 },
      ]);

      const response = await programsHandler({
        request: new Request("https://example.com/api/programs"),
        env,
      });
      const data = await parseJsonResponse(response);

      expect(data.programs[0].prices).toHaveLength(1);
      expect(data.programs[0].prices[0].amount).toBe(10000);
    });
  });

  describe("POST /api/contact", () => {
    it("should return 400 for missing required fields", async () => {
      const request = createMockRequest("POST", "https://example.com/api/contact", {
        body: { name: "John", email: "john@example.com" }, // missing subject and message
      });

      const response = await contactPostHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.message).toBe("Missing required fields");
    });

    it("should create contact submission successfully", async () => {
      const mockDb = env.DB as any;
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({
          success: true,
          meta: { last_row_id: 123 },
        }),
      });

      const request = createMockRequest("POST", "https://example.com/api/contact", {
        body: {
          name: "John Doe",
          email: "john@example.com",
          subject: "Test Subject",
          message: "Test message content",
        },
      });

      const response = await contactPostHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.message).toContain("sent successfully");
      expect(data.contact).toBeDefined();
      expect(data.id).toBe(123);
    });

    it("should handle database errors gracefully", async () => {
      const mockDb = env.DB as any;
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockRejectedValue(new Error("DB Error")),
      });

      const request = createMockRequest("POST", "https://example.com/api/contact", {
        body: {
          name: "John Doe",
          email: "john@example.com",
          subject: "Test",
          message: "Test message",
        },
      });

      const response = await contactPostHandler({ request, env });

      expect(response.status).toBe(500);
    });
  });

  describe("GET /api/contact", () => {
    it("should return empty array for public access", async () => {
      const request = createMockRequest("GET", "https://example.com/api/contact");

      const response = await contactGetHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should return 401 for admin access without password", async () => {
      const request = createMockRequest("GET", "https://example.com/api/contact?admin=true");

      const response = await contactGetHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 for admin access with wrong password", async () => {
      const request = createMockRequest("GET", "https://example.com/api/contact?admin=true&password=wrong");

      const response = await contactGetHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return contacts for admin with correct password", async () => {
      const mockDb = env.DB as any;
      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [
            { id: 1, name: "John", email: "john@example.com", subject: "Test", message: "Hello", timestamp: "2024-01-01" },
          ],
        }),
      });

      const request = createMockRequest("GET", "https://example.com/api/contact?admin=true&password=admin123");

      const response = await contactGetHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.contacts).toHaveLength(1);
      expect(data.total).toBe(1);
    });
  });

  describe("POST /api/waitlist", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/waitlist", {
        body: { email: "test@example.com", name: "Test", programId: "1" },
      });

      const response = await waitlistHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 400 for invalid payload", async () => {
      const request = createMockRequest("POST", "https://example.com/api/waitlist", {
        body: { email: "test@example.com" }, // missing name and programId
      });

      const response = await waitlistHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should add to waitlist successfully", async () => {
      const mockDb = env.DB as any;
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn().mockResolvedValue({ name: "BJJ Program" }),
      });

      const request = createMockRequest("POST", "https://example.com/api/waitlist", {
        body: {
          email: "john@example.com",
          name: "John Doe",
          programId: "1",
          sessionId: 1,
        },
      });

      const response = await waitlistHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should handle waitlist without sessionId", async () => {
      const mockDb = env.DB as any;
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn().mockResolvedValue({ name: "BJJ Program" }),
      });

      const request = createMockRequest("POST", "https://example.com/api/waitlist", {
        body: {
          email: "john@example.com",
          name: "John Doe",
          programId: "1",
        },
      });

      const response = await waitlistHandler({ request, env });

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/discounts/validate", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "SAVE20" },
      });

      const response = await validateDiscountHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 400 for missing code", async () => {
      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: {},
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("missing_code");
    });

    it("should return valid:false for non-existent code", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", []);

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "INVALID" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("not_found");
    });

    it("should return valid:false for program mismatch", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", [
        {
          code: "SAVE20",
          type: "percentage",
          value: 20,
          program_id: "1",
          max_uses: null,
          current_uses: null,
          valid_from: null,
          valid_until: null,
          active: 1,
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "SAVE20", programId: "2" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("program_mismatch");
    });

    it("should return valid:false for max uses reached", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", [
        {
          code: "SAVE20",
          type: "percentage",
          value: 20,
          program_id: null,
          max_uses: 100,
          current_uses: 100,
          valid_from: null,
          valid_until: null,
          active: 1,
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "SAVE20" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("max_uses_reached");
    });

    it("should return valid:false for not started discount", async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", [
        {
          code: "FUTURE",
          type: "percentage",
          value: 20,
          program_id: null,
          max_uses: null,
          current_uses: null,
          valid_from: futureDate,
          valid_until: null,
          active: 1,
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "FUTURE" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("not_started");
    });

    it("should return valid:false for expired discount", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", [
        {
          code: "EXPIRED",
          type: "percentage",
          value: 20,
          program_id: null,
          max_uses: null,
          current_uses: null,
          valid_from: null,
          valid_until: pastDate,
          active: 1,
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "EXPIRED" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
      expect(data.reason).toBe("expired");
    });

    it("should return valid:true for valid discount", async () => {
      const mockDb = env.DB as any;
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

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "SAVE20" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.code).toBe("SAVE20");
      expect(data.type).toBe("percentage");
      expect(data.value).toBe(20);
    });

    it("should normalize code to uppercase", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", [
        {
          code: "SAVE20",
          type: "percentage",
          value: 20,
          program_id: null,
          max_uses: null,
          current_uses: null,
          valid_from: null,
          valid_until: null,
          active: 1,
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "save20" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(data.valid).toBe(true);
    });

    it("should handle fixed amount discounts", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", [
        {
          code: "SAVE50",
          type: "fixed",
          value: 5000,
          program_id: null,
          max_uses: null,
          current_uses: null,
          valid_from: null,
          valid_until: null,
          active: 1,
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/discounts/validate", {
        body: { code: "SAVE50" },
      });

      const response = await validateDiscountHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(data.valid).toBe(true);
      expect(data.type).toBe("fixed");
      expect(data.value).toBe(5000);
    });
  });
});
