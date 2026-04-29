import { describe, expect, it, vi, beforeEach } from "vitest";
import { onRequestGet as registrationsHandler } from "../api/admin/registrations";
import { onRequestGet as ordersHandler } from "../api/admin/orders";
import { createMockEnv, createMockRequest } from "./setup";

vi.mock("../_utils/adminAuth", async () => {
  const actual = await vi.importActual("../_utils/adminAuth");
  return {
    ...actual,
    getAdminFromRequest: vi.fn(),
  };
});

import { getAdminFromRequest } from "../_utils/adminAuth";

describe("admin ops filters", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
    vi.mocked(getAdminFromRequest).mockResolvedValue({
      adminUserId: 1,
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
    });
  });

  it("filters registrations by location and payment state", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("registrations", []);

    const request = createMockRequest("GET", "https://example.com/api/admin/registrations?locationId=oakville&paymentState=paid_partial");
    await registrationsHandler({ request, env });

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("COALESCE(ps.location_id, 'mississauga') = ?"));
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("paid_cents > 0"));
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("paid_cents < COALESCE(order_total_cents, payment_amount, 0)"));
  });

  it("filters orders by program, location, payment state, review, and search", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("enrollment_orders", []);

    const request = createMockRequest("GET", "https://example.com/api/admin/orders?programId=bjj&locationId=oakville&paymentState=failed&review=required&q=hassan");
    await ordersHandler({ request, env });

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("r.program_id = ?"));
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("COALESCE(ps.location_id, 'mississauga') = ?"));
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("o.manual_review_status = ?"));
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("latest_payment_status IN ('failed', 'requires_payment_method')"));
  });
});
