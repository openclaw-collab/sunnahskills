import { describe, expect, it } from "vitest";
import {
  kidsLineSubtotalCents,
  lineTotalAfterSiblingCents,
  siblingDiscountForKidsLineCents,
  KIDS_PER_CLASS_CENTS_DEFAULT,
} from "../pricing";

describe("pricing (kids + sibling)", () => {
  it("computes kids semester subtotal", () => {
    expect(kidsLineSubtotalCents(KIDS_PER_CLASS_CENTS_DEFAULT, 12)).toBe(15000);
  });

  it("applies 10% only to additional siblings on kids tracks", () => {
    const sub = kidsLineSubtotalCents(KIDS_PER_CLASS_CENTS_DEFAULT, 12);
    expect(siblingDiscountForKidsLineCents(0, sub, true)).toBe(0);
    expect(siblingDiscountForKidsLineCents(1, sub, true)).toBe(1500);
    expect(siblingDiscountForKidsLineCents(2, sub, true)).toBe(1500);
    expect(siblingDiscountForKidsLineCents(1, sub, false)).toBe(0);
  });

  it("line total matches subtotal minus discount", () => {
    const sub = kidsLineSubtotalCents(KIDS_PER_CLASS_CENTS_DEFAULT, 12);
    expect(lineTotalAfterSiblingCents(1, sub, true)).toBe(13500);
  });
});
