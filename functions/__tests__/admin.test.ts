/**
 * Admin Endpoint Tests
 * Tests for all admin CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestGet as registrationsListHandler } from "../api/admin/registrations";
import { onRequestGet as registrationDetailHandler, onRequestPatch as registrationUpdateHandler } from "../api/admin/registrations/[id]";
import { onRequestGet as paymentsHandler } from "../api/admin/payments";
import { onRequestGet as programsHandler, onRequestPatch as programsUpdateHandler } from "../api/admin/programs";
import { onRequestPatch as sessionsHandler } from "../api/admin/sessions";
import { onRequestGet as discountsListHandler, onRequestPost as discountsCreateHandler, onRequestPatch as discountsUpdateHandler } from "../api/admin/discounts";
import { onRequestGet as exportHandler } from "../api/admin/export";
import { onRequestGet as contactsHandler } from "../api/admin/contacts";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("../_utils/adminAuth", async () => {
  const actual = await vi.importActual("../_utils/adminAuth");
  return {
    ...actual,
    getAdminFromRequest: vi.fn(),
  };
});

import { getAdminFromRequest } from "../_utils/adminAuth";

describe("Admin Endpoints", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe("Authentication Gating", () => {
    it("should return 401 for unauthenticated requests to registrations list", async () => {
      vi.mocked(getAdminFromRequest).mockResolvedValue(null);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations");
      const response = await registrationsListHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 for unauthenticated requests to payments", async () => {
      vi.mocked(getAdminFromRequest).mockResolvedValue(null);

      const request = createMockRequest("GET", "https://example.com/api/admin/payments");
      const response = await paymentsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 for unauthenticated requests to programs", async () => {
      vi.mocked(getAdminFromRequest).mockResolvedValue(null);

      const request = createMockRequest("GET", "https://example.com/api/admin/programs");
      const response = await programsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 for unauthenticated requests to discounts", async () => {
      vi.mocked(getAdminFromRequest).mockResolvedValue(null);

      const request = createMockRequest("GET", "https://example.com/api/admin/discounts");
      const response = await discountsListHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should allow access for authenticated admin", async () => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });

      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations");
      const response = await registrationsListHandler({ request, env });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/admin/registrations", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("GET", "https://example.com/api/admin/registrations");
      const response = await registrationsListHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return list of registrations", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        {
          registration_id: 1,
          registration_status: "submitted",
          created_at: "2024-01-01T00:00:00Z",
          program_name: "BJJ",
          program_slug: "bjj",
          guardian_name: "John Doe",
          guardian_email: "john@example.com",
          student_name: "Jimmy Doe",
          payment_status: "pending",
          payment_amount: 15000,
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations");
      const response = await registrationsListHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.registrations).toHaveLength(1);
      expect(data.registrations[0].registration_id).toBe(1);
    });

    it("should filter by programId", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations?programId=1");
      await registrationsListHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("program_id = ?"));
    });

    it("should filter by status", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations?status=submitted");
      await registrationsListHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("status = ?"));
    });

    it("should filter by search query", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations?q=john");
      await registrationsListHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("LIKE ?"));
    });

    it("should limit results to 250", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations");
      await registrationsListHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("LIMIT 250"));
    });
  });

  describe("GET /api/admin/registrations/:id", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return 400 for invalid id", async () => {
      const request = createMockRequest("GET", "https://example.com/api/admin/registrations/invalid");
      const response = await registrationDetailHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid id");
    });

    it("should return 404 for non-existent registration", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations/999");
      const response = await registrationDetailHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });

    it("should return full registration details", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        {
          id: 1,
          program_name: "BJJ",
          program_slug: "bjj",
          guardian_full_name: "John Doe",
          guardian_email: "john@example.com",
          student_full_name: "Jimmy Doe",
          payment_status: "paid",
          payment_amount: 15000,
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/admin/registrations/1");
      const response = await registrationDetailHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.registration).toBeDefined();
      expect(data.registration.id).toBe(1);
    });
  });

  describe("PATCH /api/admin/registrations/:id", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should update registration status", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [{ id: 1 }]);

      const request = createMockRequest("PATCH", "https://example.com/api/admin/registrations/1", {
        body: { status: "active" },
      });

      const response = await registrationUpdateHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should update admin notes", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [{ id: 1 }]);

      const request = createMockRequest("PATCH", "https://example.com/api/admin/registrations/1", {
        body: { adminNotes: "Important note about this registration" },
      });

      const response = await registrationUpdateHandler({ request, env });

      expect(response.status).toBe(200);
    });

    it("should return 400 for invalid payload", async () => {
      const request = createMockRequest("PATCH", "https://example.com/api/admin/registrations/1", {
        body: "invalid",
      });

      const response = await registrationUpdateHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });
  });

  describe("GET /api/admin/payments", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return list of payments", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("payments", [
        {
          payment_id: 1,
          registration_id: 1,
          status: "paid",
          amount: 15000,
          currency: "usd",
          created_at: "2024-01-01T00:00:00Z",
          stripe_payment_intent_id: "pi_test123",
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/admin/payments");
      const response = await paymentsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.payments).toHaveLength(1);
      expect(data.payments[0].payment_id).toBe(1);
    });

    it("should limit results to 250", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("payments", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/payments");
      await paymentsHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("LIMIT 250"));
    });
  });

  describe("GET /api/admin/programs", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return programs and prices", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [
        { id: 1, name: "BJJ", slug: "bjj" },
        { id: 2, name: "Archery", slug: "archery" },
      ]);
      mockDb.setMockData("program_prices", [
        { id: 1, program_id: 1, amount: 10000, frequency: "monthly" },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/admin/programs");
      const response = await programsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.programs).toHaveLength(2);
      expect(data.prices).toHaveLength(1);
    });
  });

  describe("PATCH /api/admin/programs", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return 400 if priceId is missing", async () => {
      const request = createMockRequest("PATCH", "https://example.com/api/admin/programs", {
        body: { amount: 12000 },
      });

      const response = await programsUpdateHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("priceId is required");
    });

    it("should update price amount", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("PATCH", "https://example.com/api/admin/programs", {
        body: { priceId: 1, amount: 12000 },
      });

      const response = await programsUpdateHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should update registration fee", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("PATCH", "https://example.com/api/admin/programs", {
        body: { priceId: 1, registrationFee: 5000 },
      });

      const response = await programsUpdateHandler({ request, env });

      expect(response.status).toBe(200);
    });

    it("should update active status", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("PATCH", "https://example.com/api/admin/programs", {
        body: { priceId: 1, active: 0 },
      });

      const response = await programsUpdateHandler({ request, env });

      expect(response.status).toBe(200);
    });
  });

  describe("PATCH /api/admin/sessions", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return 400 if sessionId is missing", async () => {
      const request = createMockRequest("PATCH", "https://example.com/api/admin/sessions", {
        body: { visible: 0 },
      });

      const response = await sessionsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("sessionId is required");
    });

    it("should update session visibility", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("PATCH", "https://example.com/api/admin/sessions", {
        body: { sessionId: 1, visible: 0 },
      });

      const response = await sessionsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should update session status", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("PATCH", "https://example.com/api/admin/sessions", {
        body: { sessionId: 1, status: "closed" },
      });

      const response = await sessionsHandler({ request, env });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/admin/discounts", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return list of discounts", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("discounts", [
        {
          id: 1,
          code: "SAVE20",
          type: "percentage",
          value: 20,
          active: 1,
          created_at: "2024-01-01T00:00:00Z",
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/admin/discounts");
      const response = await discountsListHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.discounts).toHaveLength(1);
      expect(data.discounts[0].code).toBe("SAVE20");
    });
  });

  describe("POST /api/admin/discounts", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return 400 for invalid payload", async () => {
      const request = createMockRequest("POST", "https://example.com/api/admin/discounts", {
        body: { code: "SAVE20" },
      });

      const response = await discountsCreateHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should create percentage discount", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/admin/discounts", {
        body: { code: "SAVE20", type: "percentage", value: 20 },
      });

      const response = await discountsCreateHandler({ request, env });

      expect(response.status).toBe(201);
    });

    it("should create fixed amount discount", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/admin/discounts", {
        body: { code: "SAVE50", type: "fixed", value: 5000 },
      });

      const response = await discountsCreateHandler({ request, env });

      expect(response.status).toBe(201);
    });

    it("should normalize code to uppercase", async () => {
      const mockDb = env.DB as any;
      const bindSpy = vi.fn().mockReturnThis();
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: bindSpy,
        run: runSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/admin/discounts", {
        body: { code: "save20", type: "percentage", value: 20 },
      });

      await discountsCreateHandler({ request, env });

      expect(bindSpy).toHaveBeenCalledWith("SAVE20", expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything());
    });

    it("should support optional fields", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/admin/discounts", {
        body: {
          code: "SAVE20",
          type: "percentage",
          value: 20,
          programId: "1",
          maxUses: 100,
          validFrom: "2024-01-01T00:00:00Z",
          validUntil: "2024-12-31T23:59:59Z",
          active: 1,
        },
      });

      const response = await discountsCreateHandler({ request, env });

      expect(response.status).toBe(201);
    });
  });

  describe("PATCH /api/admin/discounts", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return 400 if id is missing", async () => {
      const request = createMockRequest("PATCH", "https://example.com/api/admin/discounts", {
        body: { active: 0 },
      });

      const response = await discountsUpdateHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("id is required");
    });

    it("should update discount active status", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("PATCH", "https://example.com/api/admin/discounts", {
        body: { id: 1, active: 0 },
      });

      const response = await discountsUpdateHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should update max uses", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("PATCH", "https://example.com/api/admin/discounts", {
        body: { id: 1, maxUses: 50 },
      });

      const response = await discountsUpdateHandler({ request, env });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/admin/export", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return CSV export", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", [
        {
          registration_id: 1,
          registration_status: "active",
          created_at: "2024-01-01T00:00:00Z",
          program_name: "BJJ",
          guardian_name: "John Doe",
          guardian_email: "john@example.com",
          guardian_phone: "555-1234",
          student_name: "Jimmy Doe",
          student_age: 14,
          payment_status: "paid",
          payment_amount: 15000,
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/admin/export");
      const response = await exportHandler({ request, env });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toContain("registrations.csv");
    });

    it("should include all required CSV headers", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("registrations", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/export");
      const response = await exportHandler({ request, env });
      const csv = await response.text();

      expect(csv).toContain("registration_id");
      expect(csv).toContain("registration_status");
      expect(csv).toContain("created_at");
      expect(csv).toContain("program_name");
      expect(csv).toContain("guardian_name");
      expect(csv).toContain("guardian_email");
      expect(csv).toContain("guardian_phone");
      expect(csv).toContain("student_name");
      expect(csv).toContain("student_age");
      expect(csv).toContain("payment_status");
      expect(csv).toContain("payment_amount");
    });
  });

  describe("GET /api/admin/contacts", () => {
    beforeEach(() => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
      });
    });

    it("should return list of contacts", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("contacts", [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          subject: "Test Subject",
          message: "Test message",
          timestamp: "2024-01-01T00:00:00Z",
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/admin/contacts");
      const response = await contactsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.contacts).toHaveLength(1);
      expect(data.contacts[0].name).toBe("John Doe");
    });

    it("should limit results to 500", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("contacts", []);

      const request = createMockRequest("GET", "https://example.com/api/admin/contacts");
      await contactsHandler({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("LIMIT 500"));
    });
  });
});
