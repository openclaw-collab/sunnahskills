/**
 * Registration Endpoint Tests
 * Tests for POST /api/register
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestPost } from "../api/register";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("../_utils/email", () => ({
  sendMailChannelsEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("../_utils/emailTemplates", () => ({
  registrationConfirmationEmail: vi.fn().mockReturnValue({
    subject: "Registration received",
    text: "Test email text",
    html: "<p>Test email html</p>",
  }),
  adminNewRegistrationEmail: vi.fn().mockReturnValue({
    subject: "New registration",
    text: "Admin email text",
    html: "<p>Admin email html</p>",
  }),
}));

describe("Registration Endpoint", () => {
  let env: ReturnType<typeof createMockEnv>;

  const validRegistrationPayload = {
    programSlug: "bjj",
    guardian: {
      fullName: "John Doe",
      email: "john@example.com",
      phone: "555-1234",
      emergencyContactName: "Jane Doe",
      emergencyContactPhone: "555-5678",
      relationship: "Parent",
      notes: "Test notes",
    },
    student: {
      fullName: "Jimmy Doe",
      preferredName: "Jim",
      dateOfBirth: "2010-01-01",
      age: 14,
      gender: "male",
      skillLevel: "beginner",
      medicalNotes: "None",
    },
    programDetails: {
      sessionId: 1,
      priceId: 1,
      preferredStartDate: "2024-01-15",
      scheduleChoice: "weekday-afternoon",
      programSpecific: {},
    },
    waivers: {
      liabilityWaiver: true,
      photoConsent: true,
      medicalConsent: true,
      termsAgreement: true,
      signatureText: "John Doe",
      signedAt: "2024-01-01T00:00:00Z",
    },
  };

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      const response = await onRequestPost({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 400 for invalid payload", async () => {
      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: { invalid: "data" },
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
      expect(data.issues).toBeDefined();
    });

    it("should return 400 for invalid program slug", async () => {
      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: { ...validRegistrationPayload, programSlug: "invalid-program" },
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should return 400 for missing required guardian fields", async () => {
      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: {
          ...validRegistrationPayload,
          guardian: { ...validRegistrationPayload.guardian, fullName: "" },
        },
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should return 400 for invalid email format", async () => {
      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: {
          ...validRegistrationPayload,
          guardian: { ...validRegistrationPayload.guardian, email: "invalid-email" },
        },
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should return 400 for missing required student fields", async () => {
      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: {
          ...validRegistrationPayload,
          student: { ...validRegistrationPayload.student, fullName: "" },
        },
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });

    it("should return 400 for missing waiver agreements", async () => {
      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: {
          ...validRegistrationPayload,
          waivers: { ...validRegistrationPayload.waivers, liabilityWaiver: false },
        },
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid payload");
    });
  });

  describe("Program and Session Handling", () => {
    it("should return 404 for non-existent program", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", []);

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Program not found");
    });

    it("should handle session capacity check when session is full", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj" }]);
      mockDb.setMockData("program_sessions", [
        { id: 1, capacity: 10, enrolled_count: 10 },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.waitlisted).toBe(true);
      expect(data.position).toBeDefined();
    });

    it("should allow registration when session has capacity", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);
      mockDb.setMockData("program_sessions", [
        { id: 1, capacity: 10, enrolled_count: 5 },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.registrationId).toBeDefined();
      expect(data.status).toBe("submitted");
    });

    it("should skip capacity check when no session is specified", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);

      const payloadWithoutSession = {
        ...validRegistrationPayload,
        programDetails: { ...validRegistrationPayload.programDetails, sessionId: null },
      };

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: payloadWithoutSession,
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });

  describe("Database Operations", () => {
    it("should create guardian record", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      await onRequestPost({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO guardians")
      );
    });

    it("should create student record", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      await onRequestPost({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO students")
      );
    });

    it("should create registration record", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      await onRequestPost({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO registrations")
      );
    });

    it("should create waiver record", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      await onRequestPost({ request, env });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO waivers")
      );
    });

    it("should handle guardian creation failure", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
        first: vi.fn().mockResolvedValue(null),
      });

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: validRegistrationPayload,
      });

      const response = await onRequestPost({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create guardian");
    });
  });

  describe("All Program Types", () => {
    const programTypes = ["bjj", "archery", "outdoor", "bullyproofing"];

    programTypes.forEach((programType) => {
      it(`should accept ${programType} program slug`, async () => {
        const mockDb = env.DB as any;
        mockDb.setMockData("programs", [{ id: 1, slug: programType, name: `${programType} Program` }]);

        const request = createMockRequest("POST", "https://example.com/api/register", {
          body: { ...validRegistrationPayload, programSlug: programType },
        });

        const response = await onRequestPost({ request, env });

        expect(response.status).toBe(200);
      });
    });
  });

  describe("Optional Fields", () => {
    it("should handle minimal payload with only required fields", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("programs", [{ id: 1, slug: "bjj", name: "BJJ Program" }]);

      const minimalPayload = {
        programSlug: "bjj",
        guardian: {
          fullName: "John Doe",
          email: "john@example.com",
          phone: "555-1234",
        },
        student: {
          fullName: "Jimmy Doe",
        },
        programDetails: {
          programSpecific: {},
        },
        waivers: {
          liabilityWaiver: true,
          photoConsent: true,
          medicalConsent: true,
          termsAgreement: true,
        },
      };

      const request = createMockRequest("POST", "https://example.com/api/register", {
        body: minimalPayload,
      });

      const response = await onRequestPost({ request, env });

      expect(response.status).toBe(200);
    });
  });
});
