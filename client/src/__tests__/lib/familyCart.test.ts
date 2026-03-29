import {
  buildFamilyCartFingerprint,
  clearPendingFamilyCheckout,
  loadPendingFamilyCheckout,
  savePendingFamilyCheckout,
  type FamilyCart,
} from "@/lib/familyCart";
import { describe, expect, it, beforeEach } from "vitest";

const sampleCart: FamilyCart = {
  account: {
    fullName: "Sidrah Muhaseen",
    email: "sidrah@example.com",
    phone: "555-111-2222",
    emergencyContactName: "Hammad Muhaseen",
    emergencyContactPhone: "555-333-4444",
    accountRole: "parent_guardian",
  },
  lines: [
    {
      id: "line-b",
      participant: {
        id: 2,
        participantType: "child",
        fullName: "Zayd Muhaseen",
        dateOfBirth: "2014-04-02",
        gender: "male",
        experienceLevel: "beginner",
      },
      paymentChoice: "plan",
      discountCode: "onceaweek",
      programDetails: {
        sessionId: 11,
        priceId: 101,
        programSpecific: {
          bjjTrack: "boys-7-13",
        },
      },
    },
    {
      id: "line-a",
      participant: {
        id: 1,
        participantType: "child",
        fullName: "Eesa Muhaseen",
        dateOfBirth: "2012-05-01",
        gender: "male",
        experienceLevel: "intermediate",
      },
      paymentChoice: "full",
      programDetails: {
        sessionId: 11,
        priceId: 101,
        programSpecific: {
          bjjTrack: "boys-7-13",
        },
      },
    },
  ],
};

describe("familyCart pending checkout helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("builds a stable fingerprint regardless of line ordering", () => {
    const original = buildFamilyCartFingerprint(sampleCart, " onceaweek ");
    const reversed = buildFamilyCartFingerprint(
      { ...sampleCart, lines: [...sampleCart.lines].reverse() },
      "ONCEAWEEK",
    );

    expect(original).toBe(reversed);
  });

  it("normalizes the proration code when saving pending checkout", () => {
    savePendingFamilyCheckout({
      orderId: 25,
      firstRegistrationId: 65,
      prorationCode: " onceaweek ",
      cartFingerprint: buildFamilyCartFingerprint(sampleCart, "ONCEAWEEK"),
    });

    expect(loadPendingFamilyCheckout()).toEqual({
      orderId: 25,
      firstRegistrationId: 65,
      prorationCode: "ONCEAWEEK",
      cartFingerprint: buildFamilyCartFingerprint(sampleCart, "ONCEAWEEK"),
    });

    clearPendingFamilyCheckout();
    expect(loadPendingFamilyCheckout()).toBeNull();
  });
});
