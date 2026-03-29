import { describe, expect, it } from "vitest";
import { siblingDiscountEligibleForLine } from "../orderPricing";

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
