import { describe, expect, it } from "vitest";
import {
  kidsLineSubtotalCents,
  lineTotalAfterSiblingCents,
  siblingDiscountForLineCents,
  KIDS_PER_CLASS_CENTS_DEFAULT,
} from "../pricing";

describe("pricing (kids + sibling)", () => {
  it("computes kids semester subtotal", () => {
    expect(kidsLineSubtotalCents(KIDS_PER_CLASS_CENTS_DEFAULT, 12)).toBe(14400);
  });

  it("applies 10% when a line is sibling-eligible", () => {
    const sub = kidsLineSubtotalCents(KIDS_PER_CLASS_CENTS_DEFAULT, 12);
    expect(siblingDiscountForLineCents(sub, false)).toBe(0);
    expect(siblingDiscountForLineCents(sub, true)).toBe(1440);
  });

  it("line total matches subtotal minus discount", () => {
    const sub = kidsLineSubtotalCents(KIDS_PER_CLASS_CENTS_DEFAULT, 12);
    expect(lineTotalAfterSiblingCents(sub, true)).toBe(12960);
  });
});
