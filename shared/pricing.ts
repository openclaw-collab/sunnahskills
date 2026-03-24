/**
 * Pure pricing helpers for kids BJJ lines + sibling discount (merged plan §4d).
 * Server routes should recompute amounts; this module is for tests and UI previews.
 */

export const KIDS_PER_CLASS_CENTS_DEFAULT = 1250;
export const SIBLING_DISCOUNT_PERCENT = 10;

export function kidsLineSubtotalCents(perClassCents: number, classesInSemester: number) {
  return Math.max(0, Math.round(perClassCents)) * Math.max(1, Math.round(classesInSemester));
}

/**
 * 10% off each *additional* sibling’s kids lines only (0-based line index: first kids line full price).
 */
export function siblingDiscountForKidsLineCents(lineIndex: number, lineSubtotalCents: number, isKidsTrack: boolean) {
  if (!isKidsTrack || lineIndex <= 0) return 0;
  return Math.floor((lineSubtotalCents * SIBLING_DISCOUNT_PERCENT) / 100);
}

export function lineTotalAfterSiblingCents(lineIndex: number, lineSubtotalCents: number, isKidsTrack: boolean) {
  const d = siblingDiscountForKidsLineCents(lineIndex, lineSubtotalCents, isKidsTrack);
  return Math.max(0, lineSubtotalCents - d);
}
