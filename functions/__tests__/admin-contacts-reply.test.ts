import { beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost as replyHandler } from "../api/admin/contacts";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("../_utils/adminAuth", async () => {
  const actual = await vi.importActual("../_utils/adminAuth");
  return {
    ...actual,
    getAdminFromRequest: vi.fn(),
  };
});

vi.mock("../_utils/email", () => ({
  sendMailChannelsEmail: vi.fn(),
}));

import { getAdminFromRequest } from "../_utils/adminAuth";
import { sendMailChannelsEmail } from "../_utils/email";

describe("POST /api/admin/contacts", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
  });

  it("requires an authenticated admin", async () => {
    vi.mocked(getAdminFromRequest).mockResolvedValue(null);

    const request = createMockRequest("POST", "https://example.com/api/admin/contacts", {
      body: { contactId: 1, subject: "Re: Trial", message: "We can help." },
    });

    const response = await replyHandler({ request, env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects empty reply messages", async () => {
    vi.mocked(getAdminFromRequest).mockResolvedValue({
      adminUserId: 1,
      email: "admin@sunnahskills.com",
      name: "Admin",
      role: "admin",
    });

    const request = createMockRequest("POST", "https://example.com/api/admin/contacts", {
      body: { contactId: 1, subject: "Re: Trial", message: " " },
    });

    const response = await replyHandler({ request, env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/message/i);
  });

  it("sends a reply email to the contact", async () => {
    vi.mocked(getAdminFromRequest).mockResolvedValue({
      adminUserId: 1,
      email: "admin@sunnahskills.com",
      name: "Admin",
      role: "admin",
    });
    vi.mocked(sendMailChannelsEmail).mockResolvedValue(true);

    const mockDb = env.DB as any;
    mockDb.setMockData("contacts", [
      {
        id: 7,
        name: "Sabiha Rehan",
        email: "sabyhan1@gmail.com",
        message: "I want to register for horseback riding",
        timestamp: "2026-04-14T01:28:01.493Z",
      },
    ]);

    const request = createMockRequest("POST", "https://example.com/api/admin/contacts", {
      body: {
        contactId: 7,
        subject: "Re: Horseback riding",
        message: "Assalamu alaykum. We will add you to the interest list.",
      },
    });

    const response = await replyHandler({ request, env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendMailChannelsEmail).toHaveBeenCalledWith(
      env,
      expect.objectContaining({
        to: { email: "sabyhan1@gmail.com", name: "Sabiha Rehan" },
        from: { email: "test@sunnahskills.pages.dev", name: "Sunnah Skills" },
        replyTo: { email: "admin@sunnahskills.pages.dev", name: "Sunnah Skills" },
        subject: "Re: Horseback riding",
      }),
    );
  });
});
