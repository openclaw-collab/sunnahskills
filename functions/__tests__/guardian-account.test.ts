import { beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost as signupHandler } from "../api/guardian/signup";
import { onRequestPost as requestLinkHandler } from "../api/guardian/request-link";
import { onRequestPost as trialsHandler } from "../api/trials";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";
import { sendMailChannelsEmail } from "../_utils/email";

vi.mock("../_utils/email", () => ({
  sendMailChannelsEmail: vi.fn(),
}));

describe("Guardian account + trial email flows", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
    vi.mocked(sendMailChannelsEmail).mockResolvedValue(true);
  });

  describe("POST /api/guardian/signup", () => {
    it("creates an account and sends the branded welcome email", async () => {
      const request = createMockRequest("POST", "https://example.com/api/guardian/signup", {
        body: {
          fullName: "John Doe",
          email: "john@example.com",
          next: "/register",
        },
      });

      const response = await signupHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.emailSent).toBe(true);
      expect(vi.mocked(sendMailChannelsEmail)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(sendMailChannelsEmail).mock.calls[0]?.[1]).toMatchObject({
        subject: "Sunnah Skills — Your account link",
      });
      expect(String(vi.mocked(sendMailChannelsEmail).mock.calls[0]?.[1]?.html)).toContain("Open your account");
      expect(String(vi.mocked(sendMailChannelsEmail).mock.calls[0]?.[1]?.html)).toContain("Account number");
    });

    it("returns emailSent false when welcome email delivery fails", async () => {
      vi.mocked(sendMailChannelsEmail).mockResolvedValue(false);

      const request = createMockRequest("POST", "https://example.com/api/guardian/signup", {
        body: {
          fullName: "John Doe",
          email: "john@example.com",
        },
      });

      const response = await signupHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.emailSent).toBe(false);
      expect(String(data.message)).toContain("could not be sent");
    });

    it("returns a local preview link when email fails on localhost", async () => {
      vi.mocked(sendMailChannelsEmail).mockResolvedValue(false);
      env = createMockEnv({ SITE_URL: "http://localhost:8788" });

      const request = createMockRequest("POST", "https://example.com/api/guardian/signup", {
        body: {
          fullName: "John Doe",
          email: "john@example.com",
        },
      });

      const response = await signupHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.emailSent).toBe(false);
      expect(String(data.message)).toContain("local preview");
      expect(String(data.localPreview?.verifyUrl)).toContain("/api/guardian/verify?token=");
      expect(data.localPreview?.accountNumber).toBeTruthy();
    });
  });

  describe("POST /api/guardian/request-link", () => {
    it("returns a generic success response when the account does not exist", async () => {
      const request = createMockRequest("POST", "https://example.com/api/guardian/request-link", {
        body: {
          email: "missing@example.com",
        },
      });

      const response = await requestLinkHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(String(data.message)).toContain("If an account exists");
      expect(vi.mocked(sendMailChannelsEmail)).not.toHaveBeenCalled();
    });

    it("sends the branded sign-in email for an existing account", async () => {
      (env.DB as any).setMockData("guardian_accounts", [
        {
          id: 1,
          email: "john@example.com",
          full_name: "John Doe",
          account_number: "2039485721",
        },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/guardian/request-link", {
        body: {
          email: "john@example.com",
          next: "/register",
        },
      });

      const response = await requestLinkHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(String(data.message)).toContain("If an account exists");
      expect(vi.mocked(sendMailChannelsEmail)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(sendMailChannelsEmail).mock.calls[0]?.[1]).toMatchObject({
        subject: "Sunnah Skills — Your sign-in link",
      });
      expect(String(vi.mocked(sendMailChannelsEmail).mock.calls[0]?.[1]?.html)).toContain("Sign in");
      expect(String(vi.mocked(sendMailChannelsEmail).mock.calls[0]?.[1]?.html)).toContain("2039485721");
    });

    it("returns emailSent false when the sign-in email cannot be delivered", async () => {
      (env.DB as any).setMockData("guardian_accounts", [
        {
          id: 1,
          email: "john@example.com",
          full_name: "John Doe",
          account_number: "2039485721",
        },
      ]);
      vi.mocked(sendMailChannelsEmail).mockResolvedValue(false);

      const request = createMockRequest("POST", "https://example.com/api/guardian/request-link", {
        body: {
          email: "john@example.com",
        },
      });

      const response = await requestLinkHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.emailSent).toBe(false);
      expect(String(data.message)).toContain("could not be sent");
    });

    it("returns a local preview link for localhost when sign-in email fails", async () => {
      env = createMockEnv({ SITE_URL: "http://localhost:8788" });
      (env.DB as any).setMockData("guardian_accounts", [
        {
          id: 1,
          email: "john@example.com",
          full_name: "John Doe",
          account_number: "2039485721",
        },
      ]);
      vi.mocked(sendMailChannelsEmail).mockResolvedValue(false);

      const request = createMockRequest("POST", "https://example.com/api/guardian/request-link", {
        body: {
          email: "john@example.com",
        },
      });

      const response = await requestLinkHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.emailSent).toBe(false);
      expect(String(data.message)).toContain("local preview");
      expect(String(data.localPreview?.verifyUrl)).toContain("/api/guardian/verify?token=");
      expect(data.localPreview?.accountNumber).toBe("2039485721");
    });
  });

  describe("POST /api/trials", () => {
    it("returns emailSent false with a clear warning when the confirmation email fails", async () => {
      vi.mocked(sendMailChannelsEmail).mockResolvedValue(false);

      const request = createMockRequest("POST", "https://example.com/api/trials", {
        body: {
          accountHolderName: "John Doe",
          email: "john@example.com",
          phone: "555-123-4567",
          participantType: "child",
          participantName: "Jimmy Doe",
          participantAge: 10,
          participantGender: "Male",
          desiredDate: "2026-04-01",
          programId: "bjj",
          notes: "",
        },
      });

      const response = await trialsHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.emailSent).toBe(false);
      expect(String(data.message)).toContain("could not send the confirmation email");
    });
  });
});
