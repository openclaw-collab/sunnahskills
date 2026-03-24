/**
 * Auth Endpoint Tests
 * Tests for login, logout, and me endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as bcrypt from "bcryptjs";
import { onRequestPost as loginHandler } from "../api/auth/login";
import { onRequestPost as logoutHandler } from "../api/auth/logout";
import { onRequestGet as meHandler } from "../api/auth/me";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("bcryptjs");
vi.mock("../_utils/adminAuth", async () => {
  const actual = await vi.importActual("../_utils/adminAuth");
  return {
    ...actual,
    createAdminSession: vi.fn().mockResolvedValue({
      token: "test-session-token",
      expiresAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      cookie: "admin_session=test-session-token; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800",
    }),
    getAdminFromRequest: vi.fn(),
    clearAdminSessionCookie: vi.fn().mockReturnValue(
      "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    ),
  };
});

import { createAdminSession, getAdminFromRequest } from "../_utils/adminAuth";

describe("Auth Endpoints", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/auth/login", {
        body: { email: "test@example.com", password: "password123" },
      });

      const response = await loginHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 400 for invalid credentials format", async () => {
      const request = createMockRequest("POST", "https://example.com/api/auth/login", {
        body: { email: "", password: "short" },
      });

      const response = await loginHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should return 401 for non-existent user", async () => {
      const request = createMockRequest("POST", "https://example.com/api/auth/login", {
        body: { email: "nonexistent@example.com", password: "password123" },
      });

      const response = await loginHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should return 401 for incorrect password", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("admin_users", [
        {
          id: 1,
          email: "admin@example.com",
          password_hash: "$2a$10$hashedpassword",
          name: "Admin User",
          role: "admin",
        },
      ]);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const request = createMockRequest("POST", "https://example.com/api/auth/login", {
        body: { email: "admin@example.com", password: "wrongpassword" },
      });

      const response = await loginHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should login successfully with valid credentials", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("admin_users", [
        {
          id: 1,
          email: "admin@example.com",
          password_hash: "$2a$10$hashedpassword",
          name: "Admin User",
          role: "admin",
        },
      ]);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const request = createMockRequest("POST", "https://example.com/api/auth/login", {
        body: { email: "admin@example.com", password: "correctpassword" },
      });

      const response = await loginHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.user).toEqual({
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      });

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("admin_session=test-session-token");
    });

    it("should handle missing request body", async () => {
      const request = new Request("https://example.com/api/auth/login", {
        method: "POST",
        body: "invalid json",
      });

      const response = await loginHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid credentials");
    });

    it("should normalize email to lowercase", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("admin_users", [
        {
          id: 1,
          email: "admin@example.com",
          password_hash: "$2a$10$hashedpassword",
          name: "Admin User",
          role: "admin",
        },
      ]);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const request = createMockRequest("POST", "https://example.com/api/auth/login", {
        body: { email: "ADMIN@EXAMPLE.COM", password: "correctpassword" },
      });

      const response = await loginHandler({ request, env });

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/auth/logout");

      const response = await logoutHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should logout and clear session cookie", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("admin_sessions", [{ token: "valid-session-token" }]);

      const request = createMockRequest("POST", "https://example.com/api/auth/logout", {
        cookies: { admin_session: "valid-session-token" },
      });

      const response = await logoutHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("admin_session=");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("should handle logout without session cookie", async () => {
      const request = createMockRequest("POST", "https://example.com/api/auth/logout");

      const response = await logoutHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("should delete session from database", async () => {
      const mockDb = env.DB as any;
      const deleteSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: deleteSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/auth/logout", {
        cookies: { admin_session: "session-to-delete" },
      });

      await logoutHandler({ request, env });

      expect(deleteSpy).toHaveBeenCalled();
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("GET", "https://example.com/api/auth/me");

      const response = await meHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 401 for unauthenticated user", async () => {
      vi.mocked(getAdminFromRequest).mockResolvedValue(null);

      const request = createMockRequest("GET", "https://example.com/api/auth/me");

      const response = await meHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });

    it("should return user info for authenticated user", async () => {
      vi.mocked(getAdminFromRequest).mockResolvedValue({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      });

      const request = createMockRequest("GET", "https://example.com/api/auth/me", {
        cookies: { admin_session: "valid-token" },
      });

      const response = await meHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.user).toEqual({
        adminUserId: 1,
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      });
    });
  });
});
