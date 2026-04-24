import { beforeEach, describe, expect, it } from "vitest";
import { onRequestGet } from "../api/waivers";
import { createMockEnv, parseJsonResponse } from "./setup";

describe("GET /api/waivers", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
  });

  it("returns the requested archery waiver when available", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("waiver_documents", [
      { id: 2, slug: "archery", title: "Archery Waiver", body_html: "<p>archery</p>", version_label: "2026.04", active: 1, published_at: "2026-04-20" },
      { id: 1, slug: "registration", title: "Registration Waiver", body_html: "<p>registration</p>", version_label: "2026.03", active: 1, published_at: "2026-03-31" },
    ]);

    const response = await onRequestGet({
      request: new Request("https://example.com/api/waivers?slug=archery"),
      env,
    });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.waiver).toEqual(expect.objectContaining({ slug: "archery", title: "Archery Waiver" }));
  });

  it("falls back to the general registration waiver if the requested archery waiver is missing", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("waiver_documents", [
      { id: 1, slug: "registration", title: "Registration Waiver", body_html: "<p>registration</p>", version_label: "2026.03", active: 1, published_at: "2026-03-31" },
    ]);

    const response = await onRequestGet({
      request: new Request("https://example.com/api/waivers?slug=archery"),
      env,
    });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.waiver).toEqual(expect.objectContaining({ slug: "registration", title: "Registration Waiver" }));
  });
});
