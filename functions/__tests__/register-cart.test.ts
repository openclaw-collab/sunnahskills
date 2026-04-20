import { beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../api/register/cart";
import { createMockEnv, createMockRequest, parseJsonResponse } from "./setup";

vi.mock("../_utils/guardianAuth", () => ({
  getGuardianFromRequest: vi.fn(),
}));

vi.mock("../_utils/email", () => ({
  sendMailChannelsEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("../_utils/emailTemplates", () => ({
  registrationConfirmationEmail: vi.fn().mockReturnValue({
    subject: "Registration received",
    text: "Registration received",
    html: "<p>Registration received</p>",
  }),
  waitlistConfirmationEmail: vi.fn().mockReturnValue({
    subject: "Waitlist",
    text: "Waitlist",
    html: "<p>Waitlist</p>",
  }),
  adminNewRegistrationEmail: vi.fn().mockReturnValue({
    subject: "New registration",
    text: "New registration",
    html: "<p>New registration</p>",
  }),
}));

import { getGuardianFromRequest } from "../_utils/guardianAuth";

describe("POST /api/register/cart", () => {
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    env = createMockEnv();
    vi.clearAllMocks();
    vi.mocked(getGuardianFromRequest).mockResolvedValue({
      guardianAccountId: 11,
      email: "parent@example.com",
      accountNumber: "ACC-2001",
    } as any);
  });

  it("accepts archery as a normal account cart line at the fixed $125 price", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("programs", [{ id: "archery", name: "Traditional Archery", status: "active" }]);
    mockDb.setMockData("program_sessions", [
      { id: 21, program_id: "archery", visible: 1, status: "active", capacity: 15, enrolled_count: 0 },
    ]);
    mockDb.setMockData("waiver_documents", [
      { id: 2, slug: "archery", active: 1, title: "Archery Waiver", version_label: "2026.04" },
    ]);

    const request = createMockRequest("POST", "https://example.com/api/register/cart", {
      body: {
        account: {
          fullName: "Parent Example",
          email: "parent@example.com",
          phone: "5551234567",
          emergencyContactName: "Emergency Adult",
          emergencyContactPhone: "5559876543",
          accountRole: "parent_guardian",
        },
        lines: [
          {
            programSlug: "archery",
            participant: {
              id: 7,
              participantType: "child",
              fullName: "Amin Example",
              dateOfBirth: "2014-05-01",
              gender: "male",
              experienceLevel: "beginner",
            },
            paymentChoice: "full",
            programDetails: {
              sessionId: 21,
              priceId: null,
              programSpecific: {
                eyeDominance: "right",
                dominantHand: "right",
                experience: "beginner",
              },
            },
          },
        ],
        waivers: {
          waiverId: 2,
          liabilityWaiver: true,
          photoConsent: false,
          medicalConsent: true,
          termsAgreement: true,
          signatureText: "Parent Example",
          signedAt: "2026-04-20",
        },
      },
    });

    const response = await onRequestPost({ request, env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.summary.totalCents).toBe(12500);
    expect(data.summary.dueTodayCents).toBe(12500);
    expect(data.summary.dueLaterCents).toBe(0);
    expect(data.registrationIds).toHaveLength(1);
  });
});
