/**
 * Utility Function Tests
 * Tests for adminAuth, cookies, and emailTemplates
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAdminSession,
  getAdminFromRequest,
  clearAdminSessionCookie,
} from "../_utils/adminAuth";
import {
  parseCookieHeader,
  serializeCookie,
} from "../_utils/cookies";
import {
  guardianSignInLinkEmail,
  guardianWelcomeEmail,
  registrationConfirmationEmail,
  waitlistConfirmationEmail,
  paymentReceiptEmail,
  adminNewRegistrationEmail,
  adminPaymentReceivedEmail,
} from "../_utils/emailTemplates";

describe("Utility Functions", () => {
  describe("adminAuth", () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn(),
      };
    });

    describe("createAdminSession", () => {
      it("should create a session with valid token", async () => {
        mockDb.run.mockResolvedValue({ success: true });

        const result = await createAdminSession({ DB: mockDb as any }, 1);

        expect(result.token).toBeDefined();
        expect(result.token).toMatch(/^[0-9a-f-]{36}$/);
        expect(result.expiresAtIso).toBeDefined();
        expect(result.cookie).toContain("admin_session=");
        expect(result.cookie).toContain("HttpOnly");
        expect(result.cookie).toContain("SameSite=Lax");
        expect(result.cookie).toContain("Max-Age=604800");
      });

      it("should insert session into database", async () => {
        mockDb.run.mockResolvedValue({ success: true });

        await createAdminSession({ DB: mockDb as any }, 1);

        expect(mockDb.prepare).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO admin_sessions")
        );
        expect(mockDb.bind).toHaveBeenCalledWith(
          1,
          expect.any(String),
          expect.any(String)
        );
      });
    });

    describe("getAdminFromRequest", () => {
      it("should return null if no session cookie", async () => {
        const request = new Request("https://example.com", {
          headers: {},
        });

        const result = await getAdminFromRequest({ DB: mockDb as any }, request);

        expect(result).toBeNull();
      });

      it("should return null if session not found", async () => {
        mockDb.first.mockResolvedValue(null);

        const request = new Request("https://example.com", {
          headers: {
            Cookie: "admin_session=invalid-token",
          },
        });

        const result = await getAdminFromRequest({ DB: mockDb as any }, request);

        expect(result).toBeNull();
      });

      it("should return null if session is expired", async () => {
        const expiredDate = new Date(Date.now() - 1000).toISOString();
        mockDb.first.mockResolvedValue({
          admin_user_id: 1,
          expires_at: expiredDate,
          email: "admin@example.com",
          name: "Admin",
          role: "admin",
        });

        const request = new Request("https://example.com", {
          headers: {
            Cookie: "admin_session=expired-token",
          },
        });

        const result = await getAdminFromRequest({ DB: mockDb as any }, request);

        expect(result).toBeNull();
        expect(mockDb.run).toHaveBeenCalled(); // Should delete expired session
      });

      it("should return admin user for valid session", async () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        mockDb.first.mockResolvedValue({
          admin_user_id: 1,
          expires_at: futureDate,
          email: "admin@example.com",
          name: "Admin User",
          role: "superadmin",
        });

        const request = new Request("https://example.com", {
          headers: {
            Cookie: "admin_session=valid-token",
          },
        });

        const result = await getAdminFromRequest({ DB: mockDb as any }, request);

        expect(result).toEqual({
          adminUserId: 1,
          email: "admin@example.com",
          name: "Admin User",
          role: "superadmin",
          status: "active",
          permissions: {
            dashboard: "read",
            registrations: "write",
            payments: "write",
            discounts: "write",
            pricing: "write",
            sessions: "write",
            contacts: "read",
            sequences: "write",
            exports: "read",
            users: "none",
          },
        });
      });

      it("should default role to 'admin' if not set", async () => {
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        mockDb.first.mockResolvedValue({
          admin_user_id: 1,
          expires_at: futureDate,
          email: "admin@example.com",
          name: null,
          role: null,
        });

        const request = new Request("https://example.com", {
          headers: {
            Cookie: "admin_session=valid-token",
          },
        });

        const result = await getAdminFromRequest({ DB: mockDb as any }, request);

        expect(result?.role).toBe("admin");
        expect(result?.name).toBeNull();
      });
    });

    describe("clearAdminSessionCookie", () => {
      it("should return cookie with Max-Age=0", () => {
        const cookie = clearAdminSessionCookie();

        expect(cookie).toContain("admin_session=");
        expect(cookie).toContain("Max-Age=0");
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("SameSite=Lax");
      });
    });
  });

  describe("cookies", () => {
    describe("parseCookieHeader", () => {
      it("should return empty object for null header", () => {
        const result = parseCookieHeader(null);
        expect(result).toEqual({});
      });

      it("should return empty object for empty string", () => {
        const result = parseCookieHeader("");
        expect(result).toEqual({});
      });

      it("should parse single cookie", () => {
        const result = parseCookieHeader("session=abc123");
        expect(result).toEqual({ session: "abc123" });
      });

      it("should parse multiple cookies", () => {
        const result = parseCookieHeader("session=abc123; user=john");
        expect(result).toEqual({ session: "abc123", user: "john" });
      });

      it("should handle URL-encoded values", () => {
        const result = parseCookieHeader("data=hello%20world");
        expect(result).toEqual({ data: "hello world" });
      });

      it("should handle equals signs in values", () => {
        const result = parseCookieHeader("data=key=value");
        expect(result).toEqual({ data: "key=value" });
      });

      it("should trim whitespace", () => {
        const result = parseCookieHeader("  session=abc123  ;  user=john  ");
        expect(result).toEqual({ session: "abc123", user: "john" });
      });
    });

    describe("serializeCookie", () => {
      it("should serialize basic cookie", () => {
        const result = serializeCookie("session", "abc123");
        expect(result).toBe("session=abc123; Path=/");
      });

      it("should include httpOnly flag", () => {
        const result = serializeCookie("session", "abc123", { httpOnly: true });
        expect(result).toContain("HttpOnly");
      });

      it("should include secure flag", () => {
        const result = serializeCookie("session", "abc123", { secure: true });
        expect(result).toContain("Secure");
      });

      it("should include sameSite attribute", () => {
        const result = serializeCookie("session", "abc123", { sameSite: "Strict" });
        expect(result).toContain("SameSite=Strict");
      });

      it("should include custom path", () => {
        const result = serializeCookie("session", "abc123", { path: "/admin" });
        expect(result).toContain("Path=/admin");
      });

      it("should include maxAge", () => {
        const result = serializeCookie("session", "abc123", { maxAge: 3600 });
        expect(result).toContain("Max-Age=3600");
      });

      it("should URL-encode value", () => {
        const result = serializeCookie("data", "hello world");
        expect(result).toContain("data=hello%20world");
      });

      it("should combine all options", () => {
        const result = serializeCookie("session", "abc123", {
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          path: "/",
          maxAge: 604800,
        });

        expect(result).toContain("session=abc123");
        expect(result).toContain("Path=/");
        expect(result).toContain("Max-Age=604800");
        expect(result).toContain("HttpOnly");
        expect(result).toContain("Secure");
        expect(result).toContain("SameSite=Lax");
      });
    });
  });

  describe("emailTemplates", () => {
    describe("registrationConfirmationEmail", () => {
      it("should generate email with all fields", () => {
        const result = registrationConfirmationEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          registrationId: 123,
          siteUrl: "https://example.com",
        });

        expect(result.subject).toBe("Sunnah Skills — Registration received");
        expect(result.text).toContain("John Doe");
        expect(result.text).toContain("Jimmy Doe");
        expect(result.text).toContain("BJJ");
        expect(result.text).toContain("123");
        expect(result.html).toContain("John Doe");
        expect(result.html).toContain("Jimmy Doe");
        expect(result.html).toContain("BJJ");
        expect(result.html).toContain("123");
      });

      it("should include CTA button when siteUrl provided", () => {
        const result = registrationConfirmationEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          registrationId: 123,
          siteUrl: "https://example.com",
        });

        expect(result.html).toContain("View status");
        expect(result.html).toContain("https://example.com/registration/pending");
      });

      it("should not include CTA button when siteUrl not provided", () => {
        const result = registrationConfirmationEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          registrationId: 123,
        });

        expect(result.html).not.toContain("View status");
      });

      it("should escape HTML in names", () => {
        const result = registrationConfirmationEmail({
          guardianName: "<script>alert('xss')</script>",
          studentName: "Jimmy",
          programName: "BJJ",
          registrationId: 123,
        });

        expect(result.html).not.toContain("<script>");
        expect(result.html).toContain("&lt;script&gt;");
      });
    });

    describe("guardianWelcomeEmail", () => {
      it("includes account number and CTA", () => {
        const result = guardianWelcomeEmail({
          fullName: "John Doe",
          accountNumber: "2039485721",
          verifyUrl: "https://example.com/api/guardian/verify?token=abc",
        });

        expect(result.subject).toBe("Sunnah Skills — Your account link");
        expect(result.text).toContain("2039485721");
        expect(result.html).toContain("Open your account");
        expect(result.html).toContain("2039485721");
        expect(result.html).toContain("https://example.com/api/guardian/verify?token=abc");
      });
    });

    describe("guardianSignInLinkEmail", () => {
      it("includes account number and sign-in CTA", () => {
        const result = guardianSignInLinkEmail({
          fullName: "John Doe",
          accountNumber: "2039485721",
          verifyUrl: "https://example.com/api/guardian/verify?token=xyz",
        });

        expect(result.subject).toBe("Sunnah Skills — Your sign-in link");
        expect(result.text).toContain("2039485721");
        expect(result.html).toContain("Sign in");
        expect(result.html).toContain("2039485721");
        expect(result.html).toContain("https://example.com/api/guardian/verify?token=xyz");
      });

      it("handles missing account number gracefully", () => {
        const result = guardianSignInLinkEmail({
          verifyUrl: "https://example.com/api/guardian/verify?token=xyz",
        });

        expect(result.text).toContain("Not available");
        expect(result.html).toContain("Not available");
      });
    });

    describe("waitlistConfirmationEmail", () => {
      it("should generate email with all fields", () => {
        const result = waitlistConfirmationEmail({
          name: "John Doe",
          programName: "BJJ",
          siteUrl: "https://example.com",
        });

        expect(result.subject).toBe("Sunnah Skills — Waitlist confirmation");
        expect(result.text).toContain("John Doe");
        expect(result.text).toContain("BJJ");
        expect(result.html).toContain("John Doe");
        expect(result.html).toContain("BJJ");
      });

      it("should escape HTML in content", () => {
        const result = waitlistConfirmationEmail({
          name: "<b>John</b>",
          programName: "<i>BJJ</i>",
        });

        expect(result.html).not.toContain("<b>");
        expect(result.html).toContain("&lt;b&gt;");
      });
    });

    describe("paymentReceiptEmail", () => {
      it("should generate receipt with formatted amount", () => {
        const result = paymentReceiptEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          amountCents: 15000,
          currency: "usd",
          receiptUrl: "https://receipt.stripe.com/test",
        });

        expect(result.subject).toBe("Sunnah Skills — Payment received");
        expect(result.text).toContain("$150");
        expect(result.html).toContain("$150");
        expect(result.html).toContain("https://receipt.stripe.com/test");
      });

      it("should handle different currencies", () => {
        const result = paymentReceiptEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          amountCents: 10000,
          currency: "eur",
        });

        expect(result.html).toContain("€100");
      });

      it("should default to USD if currency not provided", () => {
        const result = paymentReceiptEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          amountCents: 10000,
          currency: undefined as any,
        });

        expect(result.html).toContain("$100");
      });

      it("should include receipt link when provided", () => {
        const result = paymentReceiptEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          amountCents: 10000,
          currency: "usd",
          receiptUrl: "https://receipt.stripe.com/test",
        });

        expect(result.html).toContain("View Stripe receipt");
        expect(result.html).toContain("https://receipt.stripe.com/test");
      });

      it("should not include receipt link when not provided", () => {
        const result = paymentReceiptEmail({
          guardianName: "John Doe",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          amountCents: 10000,
          currency: "usd",
        });

        expect(result.html).not.toContain("View Stripe receipt");
      });
    });

    describe("adminNewRegistrationEmail", () => {
      it("should generate admin notification email", () => {
        const result = adminNewRegistrationEmail({
          guardianName: "John Doe",
          guardianEmail: "john@example.com",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          registrationId: 123,
          siteUrl: "https://example.com",
        });

        expect(result.subject).toBe("Sunnah Skills — New registration");
        expect(result.text).toContain("John Doe");
        expect(result.text).toContain("john@example.com");
        expect(result.text).toContain("Jimmy Doe");
        expect(result.text).toContain("BJJ");
        expect(result.html).toContain("Open dashboard");
        expect(result.html).toContain("https://example.com/admin/dashboard");
      });

      it("should not include dashboard link when siteUrl not provided", () => {
        const result = adminNewRegistrationEmail({
          guardianName: "John Doe",
          guardianEmail: "john@example.com",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          registrationId: 123,
        });

        expect(result.html).not.toContain("Open dashboard");
      });
    });

    describe("adminPaymentReceivedEmail", () => {
      it("should generate admin payment notification", () => {
        const result = adminPaymentReceivedEmail({
          guardianName: "John Doe",
          guardianEmail: "john@example.com",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          amountCents: 15000,
          currency: "usd",
          registrationId: 123,
          receiptUrl: "https://receipt.stripe.com/test",
          siteUrl: "https://example.com",
        });

        expect(result.subject).toBe("Sunnah Skills — Payment received");
        expect(result.text).toContain("$150");
        expect(result.html).toContain("$150");
        expect(result.html).toContain("Stripe receipt");
        expect(result.html).toContain("Dashboard");
      });

      it("should handle missing receipt URL", () => {
        const result = adminPaymentReceivedEmail({
          guardianName: "John Doe",
          guardianEmail: "john@example.com",
          studentName: "Jimmy Doe",
          programName: "BJJ",
          amountCents: 15000,
          currency: "usd",
          registrationId: 123,
        });

        expect(result.html).not.toContain("Stripe receipt");
      });
    });

    describe("HTML escaping", () => {
      it("should escape all HTML special characters", () => {
        const result = registrationConfirmationEmail({
          guardianName: "<>&\"'",
          studentName: "Test",
          programName: "BJJ",
          registrationId: 1,
        });

        expect(result.html).toContain("&lt;");
        expect(result.html).toContain("&gt;");
        expect(result.html).toContain("&amp;");
        expect(result.html).toContain("&quot;");
        expect(result.html).toContain("&#039;");
      });
    });
  });
});
