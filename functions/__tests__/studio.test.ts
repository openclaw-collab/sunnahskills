/**
 * Studio Endpoint Tests
 * Tests for Stakeholder Studio session CRUD and sync behavior
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestPost as createSessionHandler, onRequestOptions as createSessionOptions } from "../api/studio/sessions";
import {
  onRequestGet as getSessionHandler,
  onRequestPatch as updateSessionHandler,
  onRequestPost as authSessionHandler,
  onRequestOptions as sessionOptions,
} from "../api/studio/sessions/[id]";
import { onRequestPost as uploadHandler, onRequestOptions as uploadOptions } from "../api/studio/uploads";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

import * as bcrypt from "bcryptjs";

describe("Studio Endpoints", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  describe("POST /api/studio/sessions", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/studio/sessions", {
        body: { name: "Test Session" },
      });

      const response = await createSessionHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should create a new unprotected session", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/studio/sessions", {
        body: { name: "Test Session" },
      });

      const response = await createSessionHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe("Test Session");
      expect(data.protected).toBe(false);
      expect(data.shareUrl).toContain("?studio=");
    });

    it("should create a protected session with password", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/studio/sessions", {
        body: { name: "Protected Session", password: "secret123" },
      });

      const response = await createSessionHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.protected).toBe(true);
    });

    it("should handle empty name", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = createMockRequest("POST", "https://example.com/api/studio/sessions", {
        body: { name: "   " },
      });

      const response = await createSessionHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(data.name).toBeNull();
    });

    it("should handle missing request body", async () => {
      const mockDb = env.DB as any;
      const runSpy = vi.fn().mockResolvedValue({ success: true });
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: runSpy,
      });

      const request = new Request("https://example.com/api/studio/sessions", {
        method: "POST",
        body: "invalid",
      });

      const response = await createSessionHandler({ request, env });

      expect(response.status).toBe(201);
    });
  });

  describe("OPTIONS /api/studio/sessions", () => {
    it("should return CORS headers", async () => {
      const response = await createSessionOptions();

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });
  });

  describe("GET /api/studio/sessions/:id", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("GET", "https://example.com/api/studio/sessions/test-id");

      const response = await getSessionHandler({
        request,
        params: { id: "test-id" },
        env: { DB: null as any },
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 404 for non-existent session", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", []);

      const request = createMockRequest("GET", "https://example.com/api/studio/sessions/non-existent");
      const response = await getSessionHandler({
        request,
        params: { id: "non-existent" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Session not found");
    });

    it("should return 401 for protected session without auth", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 1, name: "Protected Session" },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/studio/sessions/test-id");
      const response = await getSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.protected).toBe(true);
      expect(data.id).toBe("test-id");
    });

    it("should return full session for unprotected session", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        {
          id: "test-id",
          protected: 0,
          name: "Test Session",
          theme_preset_id: "brand",
          custom_theme_json: null,
          edits_json: "[]",
          comments_json: "[]",
          uploads_json: "[]",
          positions_json: "{}",
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/studio/sessions/test-id");
      const response = await getSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.id).toBe("test-id");
      expect(data.name).toBe("Test Session");
      expect(data.protected).toBe(false);
      expect(data.edits).toEqual([]);
      expect(data.comments).toEqual([]);
      expect(data.uploads).toEqual([]);
    });

    it("should return full session for protected session with auth cookie", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        {
          id: "test-id",
          protected: 1,
          name: "Protected Session",
          theme_preset_id: "brand",
          custom_theme_json: null,
          edits_json: "[]",
          comments_json: "[]",
          uploads_json: "[]",
          positions_json: "{}",
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/studio/sessions/test-id", {
        cookies: { studio_auth_test_id: "1" },
      });
      const response = await getSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.name).toBe("Protected Session");
    });

    it("should parse JSON fields correctly", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        {
          id: "test-id",
          protected: 0,
          name: "Test Session",
          theme_preset_id: "custom",
          custom_theme_json: JSON.stringify({ primary: "#000" }),
          edits_json: JSON.stringify([{ id: 1, text: "Edit 1" }]),
          comments_json: JSON.stringify([{ id: 1, text: "Comment 1" }]),
          uploads_json: JSON.stringify([{ id: "upload1", url: "https://example.com/img.jpg" }]),
          positions_json: JSON.stringify({ header: { x: 0, y: 0 } }),
        },
      ]);

      const request = createMockRequest("GET", "https://example.com/api/studio/sessions/test-id");
      const response = await getSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(data.customTheme).toEqual({ primary: "#000" });
      expect(data.edits).toEqual([{ id: 1, text: "Edit 1" }]);
      expect(data.comments).toEqual([{ id: 1, text: "Comment 1" }]);
      expect(data.uploads).toEqual([{ id: "upload1", url: "https://example.com/img.jpg" }]);
      expect(data.positions).toEqual({ header: { x: 0, y: 0 } });
    });
  });

  describe("PATCH /api/studio/sessions/:id", () => {
    it("should return 401 for protected session without auth", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 1 },
      ]);

      const request = createMockRequest("PATCH", "https://example.com/api/studio/sessions/test-id", {
        body: { name: "Updated Name" },
      });
      const response = await updateSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should update session name", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0, name: "Old Name" },
      ]);

      const request = createMockRequest("PATCH", "https://example.com/api/studio/sessions/test-id", {
        body: { name: "New Name" },
      });
      const response = await updateSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.name).toBe("New Name");
    });

    it("should update theme preset", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0, theme_preset_id: "brand" },
      ]);

      const request = createMockRequest("PATCH", "https://example.com/api/studio/sessions/test-id", {
        body: { themePresetId: "dark" },
      });
      const response = await updateSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.themePresetId).toBe("dark");
    });

    it("should update custom theme", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0, custom_theme_json: null },
      ]);

      const request = createMockRequest("PATCH", "https://example.com/api/studio/sessions/test-id", {
        body: { customTheme: { primary: "#fff", secondary: "#000" } },
      });
      const response = await updateSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });

      expect(response.status).toBe(200);
    });

    it("should update edits", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0, edits_json: "[]" },
      ]);

      const request = createMockRequest("PATCH", "https://example.com/api/studio/sessions/test-id", {
        body: { edits: [{ id: 1, text: "New edit" }] },
      });
      const response = await updateSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.edits).toEqual([{ id: 1, text: "New edit" }]);
    });

    it("should update comments", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0, comments_json: "[]" },
      ]);

      const request = createMockRequest("PATCH", "https://example.com/api/studio/sessions/test-id", {
        body: { comments: [{ id: 1, text: "New comment" }] },
      });
      const response = await updateSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.comments).toEqual([{ id: 1, text: "New comment" }]);
    });

    it("should return 400 for invalid body", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0 },
      ]);

      const request = createMockRequest("PATCH", "https://example.com/api/studio/sessions/test-id", {
        body: "invalid",
      });
      const response = await updateSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid body");
    });
  });

  describe("POST /api/studio/sessions/:id (auth)", () => {
    it("should auto-auth for unprotected session", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0 },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/studio/sessions/test-id", {
        body: {},
      });
      const response = await authSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("studio_auth_test_id=1");
    });

    it("should return 400 for protected session without password", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 1, password_hash: "$2a$10$hashed" },
      ]);

      const request = createMockRequest("POST", "https://example.com/api/studio/sessions/test-id", {
        body: {},
      });
      const response = await authSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Password required");
    });

    it("should return 401 for incorrect password", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 1, password_hash: "$2a$10$hashed" },
      ]);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const request = createMockRequest("POST", "https://example.com/api/studio/sessions/test-id", {
        body: { password: "wrongpassword" },
      });
      const response = await authSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBe("Incorrect password");
    });

    it("should auth successfully with correct password", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 1, password_hash: "$2a$10$hashed" },
      ]);

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const request = createMockRequest("POST", "https://example.com/api/studio/sessions/test-id", {
        body: { password: "correctpassword" },
      });
      const response = await authSessionHandler({
        request,
        params: { id: "test-id" },
        env,
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);

      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("studio_auth_test_id=1");
    });
  });

  describe("OPTIONS /api/studio/sessions/:id", () => {
    it("should return CORS headers", async () => {
      const response = await sessionOptions();

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("PATCH");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });
  });

  describe("POST /api/studio/uploads", () => {
    it("should return 500 if DB is not configured", async () => {
      const request = createMockRequest("POST", "https://example.com/api/studio/uploads?session=test-id&slot=hero");

      const response = await uploadHandler({ request, env: { DB: null as any } });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(500);
      expect(data.error).toBe("DB not configured");
    });

    it("should return 400 if session param is missing", async () => {
      const request = createMockRequest("POST", "https://example.com/api/studio/uploads?slot=hero");

      const response = await uploadHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing session param");
    });

    it("should return 404 if session not found", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", []);

      const request = createMockRequest("POST", "https://example.com/api/studio/uploads?session=non-existent&slot=hero");

      const response = await uploadHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBe("Session not found");
    });

    it("should return 400 if content-type is not multipart", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [{ id: "test-id", protected: 0 }]);

      const request = createMockRequest("POST", "https://example.com/api/studio/uploads?session=test-id&slot=hero", {
        headers: { "Content-Type": "application/json" },
      });

      const response = await uploadHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBe("Expected multipart/form-data");
    });

    it("should return 413 if file is too large", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [{ id: "test-id", protected: 0 }]);

      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], "large.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", largeFile);

      const request = new Request("https://example.com/api/studio/uploads?session=test-id&slot=hero", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const response = await uploadHandler({ request, env });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(413);
      expect(data.error).toContain("File too large");
    });

    it("should store file in R2 when available", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0, uploads_json: "[]" },
      ]);

      const mockR2Put = vi.fn().mockResolvedValue({ key: "studio/test-id/hero/test.jpg" });
      const mockR2Bucket = {
        put: mockR2Put,
      };

      const file = new File([new ArrayBuffer(1024)], "test.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);

      const request = new Request("https://example.com/api/studio/uploads?session=test-id&slot=hero&route=/", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const response = await uploadHandler({
        request,
        env: { ...env, STUDIO_UPLOADS: mockR2Bucket as any },
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.upload).toBeDefined();
      expect(data.upload.slotKey).toBe("hero");
      expect(data.upload.route).toBe("/");
      expect(mockR2Put).toHaveBeenCalledWith(
        "studio/test-id/hero/test.jpg",
        expect.any(ArrayBuffer),
        { httpMetadata: { contentType: "image/jpeg" } }
      );
    });

    it("should fallback to base64 when R2 is not available", async () => {
      const mockDb = env.DB as any;
      mockDb.setMockData("studio_sessions", [
        { id: "test-id", protected: 0, uploads_json: "[]" },
      ]);

      const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "test.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);

      const request = new Request("https://example.com/api/studio/uploads?session=test-id&slot=hero", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const response = await uploadHandler({
        request,
        env: { ...env, STUDIO_UPLOADS: undefined },
      });
      const data = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.upload.url).toContain("data:image/png;base64,");
    });
  });

  describe("OPTIONS /api/studio/uploads", () => {
    it("should return CORS headers", async () => {
      const response = await uploadOptions();

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });
  });
});
