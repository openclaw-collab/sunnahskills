import { describe, expect, it } from "vitest";
import {
  getLinePriceBreakdown,
  siblingDiscountEligibleForLine,
} from "../orderPricing";

describe("orderPricing sibling discount eligibility", () => {
  it("keeps the first child full price and discounts the second child with the same last name", () => {
    const lines = [
      {
        participantType: "child" as const,
        student: { fullName: "Eesa Muhaseen", dateOfBirth: "2015-01-01" },
      },
      {
        participantType: "child" as const,
        student: { fullName: "Zayd Muhaseen", dateOfBirth: "2017-01-01" },
      },
    ];

    expect(siblingDiscountEligibleForLine(lines, 0)).toBe(false);
    expect(siblingDiscountEligibleForLine(lines, 1)).toBe(true);
  });

  it("discounts the third child in the same family as well", () => {
    const lines = [
      {
        participantType: "child" as const,
        student: { fullName: "Eesa Muhaseen", dateOfBirth: "2015-01-01" },
      },
      {
        participantType: "child" as const,
        student: { fullName: "Zayd Muhaseen", dateOfBirth: "2017-01-01" },
      },
      {
        participantType: "child" as const,
        student: { fullName: "Umar Muhaseen", dateOfBirth: "2019-01-01" },
      },
    ];

    expect(siblingDiscountEligibleForLine(lines, 2)).toBe(true);
  });

  it("does not discount adults or unrelated last names", () => {
    const lines = [
      {
        participantType: "child" as const,
        student: { fullName: "Eesa Muhaseen", dateOfBirth: "2015-01-01" },
      },
      {
        participantType: "child" as const,
        student: { fullName: "Yusuf Khan", dateOfBirth: "2017-01-01" },
      },
      {
        participantType: "self" as const,
        student: { fullName: "Sidrah Thakur", dateOfBirth: "1987-01-01" },
      },
    ];

    expect(siblingDiscountEligibleForLine(lines, 1)).toBe(false);
    expect(siblingDiscountEligibleForLine(lines, 2)).toBe(false);
  });
});

describe("orderPricing women BJJ add-ons", () => {
  const semester = {
    classes_in_semester: 13,
    price_per_class_cents: 1200,
    registration_fee_cents: 0,
    later_payment_date: "2026-05-12",
    start_date: "2026-03-31",
    end_date: "2026-06-27",
  };

  it("prices the second weekly women class at $50 total", () => {
    const breakdown = getLinePriceBreakdown({
      track: "women-11-thu",
      priceId: 4,
      programPriceAmount: 2000,
      programPriceRegFee: 0,
      programPriceFrequency: "per_session",
      priceMetadataJson: null,
      paymentChoice: "full",
      semester,
      womenSecondWeeklyClass: true,
    });

    expect(breakdown.lineSubtotalCents).toBe(5000);
    expect(breakdown.dueTodayCents).toBe(5000);
    expect(breakdown.dueLaterCents).toBe(0);
  });

  it("prices a women self-defense date as a one-time $25 registration", () => {
    const breakdown = getLinePriceBreakdown({
      track: "women-self-defense-2026-05-28",
      priceId: 12,
      programPriceAmount: 2500,
      programPriceRegFee: 0,
      programPriceFrequency: "per_workshop",
      priceMetadataJson: null,
      paymentChoice: "full",
      semester,
    });

    expect(breakdown.scheduledClassCount).toBe(1);
    expect(breakdown.lineSubtotalCents).toBe(2500);
    expect(breakdown.dueTodayCents).toBe(2500);
  });
});
