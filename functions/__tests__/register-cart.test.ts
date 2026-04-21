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

  it("charges only $50 for the second women weekly BJJ class in the same cart", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("programs", [{ id: "bjj", name: "Brazilian Jiu-Jitsu", status: "active" }]);
    mockDb.setMockData("program_prices", [
      { id: 3, program_id: "bjj", age_group: "women-11-tue", amount: 2000, registration_fee: 0, frequency: "per_session", metadata: null, active: 1 },
      { id: 4, program_id: "bjj", age_group: "women-11-thu", amount: 2000, registration_fee: 0, frequency: "per_session", metadata: null, active: 1 },
    ]);
    mockDb.setMockData("program_sessions", [
      { id: 31, program_id: "bjj", age_group: "women-11-tue", capacity: 20, enrolled_count: 0 },
      { id: 32, program_id: "bjj", age_group: "women-11-thu", capacity: 20, enrolled_count: 0 },
    ]);
    mockDb.setMockData("semesters", [
      { classes_in_semester: 13, price_per_class_cents: 1200, registration_fee_cents: 0, later_payment_date: "2026-05-12", start_date: "2026-03-31", end_date: "2026-06-27" },
    ]);
    mockDb.setMockData("waiver_documents", [
      { id: 1, slug: "registration", active: 1, title: "Registration Waiver", version_label: "2026.03" },
    ]);

    const response = await onRequestPost({ request: createMockRequest("POST", "https://example.com/api/register/cart", {
      body: bjjCartPayload([
        { track: "women-11-tue", sessionId: 31, priceId: 3 },
        { track: "women-11-thu", sessionId: 32, priceId: 4 },
      ]),
    }), env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.summary.totalCents).toBe(31000);
    expect(data.summary.dueTodayCents).toBe(31000);
    const orders = mockDb.mockData.enrollment_orders;
    expect(orders.at(-1)?.id).toBeDefined();
  });

  it("charges only $50 when a participant already has the other women weekly BJJ class", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("programs", [{ id: "bjj", name: "Brazilian Jiu-Jitsu", status: "active" }]);
    mockDb.setMockData("program_prices", [
      { id: 4, program_id: "bjj", age_group: "women-11-thu", amount: 2000, registration_fee: 0, frequency: "per_session", metadata: null, active: 1 },
    ]);
    mockDb.setMockData("program_sessions", [
      { id: 32, program_id: "bjj", age_group: "women-11-thu", capacity: 20, enrolled_count: 0 },
    ]);
    mockDb.setMockData("semesters", [
      { classes_in_semester: 13, price_per_class_cents: 1200, registration_fee_cents: 0, later_payment_date: "2026-05-12", start_date: "2026-03-31", end_date: "2026-06-27" },
    ]);
    mockDb.setMockData("waiver_documents", [
      { id: 1, slug: "registration", active: 1, title: "Registration Waiver", version_label: "2026.03" },
    ]);
    mockDb.setMockData("registrations", [
      {
        guardian_account_id: 11,
        student_full_name: "Aisha Example",
        student_date_of_birth: "2000-05-01",
        program_id: "bjj",
        schedule_choice: "women-11-tue",
        status: "active",
      },
    ]);

    const response = await onRequestPost({ request: createMockRequest("POST", "https://example.com/api/register/cart", {
      body: bjjCartPayload([{ track: "women-11-thu", sessionId: 32, priceId: 4 }]),
    }), env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.summary.totalCents).toBe(5000);
    expect(data.summary.dueTodayCents).toBe(5000);
  });

  it("does not allow women self-defense when the participant has a women weekly BJJ class selected", async () => {
    const mockDb = env.DB as any;
    mockDb.setMockData("programs", [{ id: "bjj", name: "Brazilian Jiu-Jitsu", status: "active" }]);
    mockDb.setMockData("program_prices", [
      { id: 3, program_id: "bjj", age_group: "women-11-tue", amount: 2000, registration_fee: 0, frequency: "per_session", metadata: null, active: 1 },
      { id: 12, program_id: "bjj", age_group: "women-self-defense-2026-05-28", amount: 2500, registration_fee: 0, frequency: "per_workshop", metadata: null, active: 1 },
    ]);
    mockDb.setMockData("program_sessions", [
      { id: 31, program_id: "bjj", age_group: "women-11-tue", capacity: 20, enrolled_count: 0 },
      { id: 42, program_id: "bjj", age_group: "women-self-defense-2026-05-28", capacity: 30, enrolled_count: 0 },
    ]);
    mockDb.setMockData("semesters", [
      { classes_in_semester: 13, price_per_class_cents: 1200, registration_fee_cents: 0, later_payment_date: "2026-05-12", start_date: "2026-03-31", end_date: "2026-06-27" },
    ]);
    mockDb.setMockData("waiver_documents", [
      { id: 1, slug: "registration", active: 1, title: "Registration Waiver", version_label: "2026.03" },
    ]);

    const response = await onRequestPost({ request: createMockRequest("POST", "https://example.com/api/register/cart", {
      body: bjjCartPayload([
        { track: "women-11-tue", sessionId: 31, priceId: 3 },
        { track: "women-self-defense-2026-05-28", sessionId: 42, priceId: 12 },
      ]),
    }), env });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/self-defense/i);
  });
});

function bjjCartPayload(lines: Array<{ track: string; sessionId: number; priceId: number }>) {
  return {
    account: {
      fullName: "Parent Example",
      email: "parent@example.com",
      phone: "5551234567",
      emergencyContactName: "Emergency Adult",
      emergencyContactPhone: "5559876543",
      accountRole: "parent_guardian",
    },
    lines: lines.map((line) => ({
      programSlug: "bjj",
      participant: {
        id: 7,
        participantType: "self",
        fullName: "Aisha Example",
        dateOfBirth: "2000-05-01",
        gender: "female",
        experienceLevel: "beginner",
      },
      paymentChoice: "full",
      programDetails: {
        sessionId: line.sessionId,
        priceId: line.priceId,
        programSpecific: {
          bjjTrack: line.track,
        },
      },
    })),
    waivers: {
      waiverId: 1,
      liabilityWaiver: true,
      photoConsent: false,
      medicalConsent: true,
      termsAgreement: true,
      signatureText: "Parent Example",
      signedAt: "2026-04-20",
    },
  };
}
