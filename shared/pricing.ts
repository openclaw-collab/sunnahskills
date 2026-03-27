/**
 * Pure pricing helpers for sibling discount math.
 * Server routes should recompute amounts; this module is for tests and UI previews.
 */

export const KIDS_PER_CLASS_CENTS_DEFAULT = 1200;
export const SIBLING_DISCOUNT_PERCENT = 10;

export function kidsLineSubtotalCents(perClassCents: number, classesInSemester: number) {
  return Math.max(0, Math.round(perClassCents)) * Math.max(1, Math.round(classesInSemester));
}

export function siblingDiscountForLineCents(lineSubtotalCents: number, siblingDiscountEligible: boolean) {
  if (!siblingDiscountEligible) return 0;
  return Math.floor((lineSubtotalCents * SIBLING_DISCOUNT_PERCENT) / 100);
}

export function lineTotalAfterSiblingCents(lineSubtotalCents: number, siblingDiscountEligible: boolean) {
  const d = siblingDiscountForLineCents(lineSubtotalCents, siblingDiscountEligible);
  return Math.max(0, lineSubtotalCents - d);
}
