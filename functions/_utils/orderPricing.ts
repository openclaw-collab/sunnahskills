import {
  KIDS_PER_CLASS_CENTS_DEFAULT,
  kidsLineSubtotalCents,
  lineTotalAfterSiblingCents,
} from "../../shared/pricing";

export type BjjTrack = string;

export function isKidsBjjTrack(track: string) {
  return track === "girls-5-10" || track === "boys-7-13";
}

export function studentKey(fullName: string, dateOfBirth: string) {
  return `${fullName.trim().toLowerCase()}|${dateOfBirth.trim()}`;
}

export type SemesterRow = {
  classes_in_semester: number;
  price_per_class_cents: number | null;
  registration_fee_cents: number | null;
  later_payment_date: string | null;
  start_date: string | null;
  end_date: string | null;
};

/**
 * Rank among students who have at least one kids line (0 = first child in cart, 1+ = sibling).
 */
export function kidsSiblingRankForLine(
  lines: { track: string; student: { fullName: string; dateOfBirth: string } }[],
  lineIndex: number,
): number {
  const target = lines[lineIndex];
  if (!isKidsBjjTrack(target.track)) return 0;

  const orderKeys: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (!isKidsBjjTrack(line.track)) continue;
    const k = studentKey(line.student.fullName, line.student.dateOfBirth);
    if (!seen.has(k)) {
      seen.add(k);
      orderKeys.push(k);
    }
  }
  const myKey = studentKey(target.student.fullName, target.student.dateOfBirth);
  return Math.max(0, orderKeys.indexOf(myKey));
}

export function computeLaterPaymentDateIso(sem: SemesterRow | null): string | null {
  if (sem?.later_payment_date?.trim()) return sem.later_payment_date.trim();
  const start = sem?.start_date ? Date.parse(sem.start_date) : NaN;
  const end = sem?.end_date ? Date.parse(sem.end_date) : NaN;
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const mid = new Date(Math.floor((start + end) / 2));
    return mid.toISOString().slice(0, 10);
  }
  return null;
}

export type LinePricingInput = {
  track: string;
  priceId: number | null;
  /** per-class or unit cents from program_prices */
  programPriceAmount: number | null;
  programPriceRegFee: number | null;
  programPriceFrequency: string | null;
  priceMetadataJson: string | null;
  paymentChoice: "full" | "plan";
  siblingRankAmongKidsStudents: number;
  semester: SemesterRow | null;
};

export type LinePricingResult = {
  lineSubtotalCents: number;
  siblingDiscountCents: number;
  afterSiblingCents: number;
  dueTodayCents: number;
  dueLaterCents: number;
};

function classesInSemesterFromPriceMeta(meta: string | null, sem: SemesterRow | null): number {
  const fromSem = sem?.classes_in_semester;
  if (Number.isInteger(fromSem) && fromSem! > 0) return fromSem!;
  if (!meta) return 12;
  try {
    const m = JSON.parse(meta) as { classes_in_semester?: number; classes_in_semester_default?: number };
    const n = Number(m.classes_in_semester ?? m.classes_in_semester_default);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  } catch {
    /* ignore */
  }
  return 12;
}

/**
 * Full line tuition + reg fee (before sibling / promo / pay split).
 */
export function computeLineTuitionCents(input: LinePricingInput): Omit<LinePricingResult, "dueTodayCents" | "dueLaterCents"> {
  const sem = input.semester;
  const classesN = classesInSemesterFromPriceMeta(input.priceMetadataJson, sem);
  const regFeeSem = sem?.registration_fee_cents ?? 0;
  const regFeePrice = input.programPriceRegFee ?? 0;
  const regFee = Number.isInteger(regFeeSem) && regFeeSem > 0 ? regFeeSem : regFeePrice;

  let tuitionCents = 0;
  if (isKidsBjjTrack(input.track)) {
    const perClass = sem?.price_per_class_cents ?? KIDS_PER_CLASS_CENTS_DEFAULT;
    tuitionCents = kidsLineSubtotalCents(perClass, classesN);
  } else {
    const unit = Number(input.programPriceAmount ?? 0);
    const freq = String(input.programPriceFrequency ?? "");
    if (freq === "per_session" && unit > 0) {
      tuitionCents = unit * classesN;
    } else {
      tuitionCents = Math.max(0, unit);
    }
  }

  const lineSubtotalCents = Math.max(0, tuitionCents + Math.max(0, regFee));

  const kidsLineIndex = input.siblingRankAmongKidsStudents; // 0 = first child’s kids line(s), 1+ = sibling
  const afterSiblingCents = lineTotalAfterSiblingCents(
    kidsLineIndex,
    lineSubtotalCents,
    isKidsBjjTrack(input.track),
  );
  const siblingDiscountCents = lineSubtotalCents - afterSiblingCents;

  return { lineSubtotalCents, siblingDiscountCents, afterSiblingCents };
}

export function splitPaymentPlan(afterSiblingCents: number, choice: "full" | "plan"): { dueToday: number; dueLater: number } {
  if (choice !== "plan" || afterSiblingCents <= 0) {
    return { dueToday: afterSiblingCents, dueLater: 0 };
  }
  const half = Math.floor(afterSiblingCents / 2);
  const dueToday = afterSiblingCents - half;
  const dueLater = half;
  return { dueToday, dueLater };
}

export function applyPromoToSubtotal(subtotalAfterSibling: number, promoDiscount: number) {
  const d = Math.max(0, Math.min(subtotalAfterSibling, promoDiscount));
  return Math.max(0, subtotalAfterSibling - d);
}
