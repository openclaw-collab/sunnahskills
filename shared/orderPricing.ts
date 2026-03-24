import {
  KIDS_PER_CLASS_CENTS_DEFAULT,
  lineTotalAfterSiblingCents,
} from "./pricing";
import { BJJ_TRACK_BY_KEY, isBjjTrackKey, isKidsBjjTrackKey } from "./bjjCatalog";

export type BjjTrack = string;

export function isKidsBjjTrack(track: string) {
  return isKidsBjjTrackKey(track);
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
  trialCreditCents?: number;
  prorationAllowed?: boolean;
  chargeDateIso?: string | null;
};

export type LinePricingResult = {
  scheduledClassCount: number;
  classesN?: number;
  perClassCents: number;
  baseTuitionCents: number;
  tuitionCents?: number;
  trialCreditCents: number;
  lineSubtotalCents: number;
  siblingDiscountCents: number;
  afterSiblingCents: number;
  dueTodayCents: number;
  dueLaterCents: number;
};

function safeMiddayDate(value: string) {
  const parsed = Date.parse(`${value}T12:00:00`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed);
}

function isoDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function weekdayName(value: Date) {
  return value.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

function maxIsoDate(a: string, b: string) {
  return a >= b ? a : b;
}

export function resolveChargeStartDateIso(
  sem: SemesterRow | null,
  chargeDateIso: string | null | undefined,
  prorationAllowed: boolean,
) {
  const semesterStart = sem?.start_date?.trim() || isoDateOnly(new Date());
  if (!prorationAllowed) return semesterStart;
  const requested = chargeDateIso?.trim() || isoDateOnly(new Date());
  return maxIsoDate(semesterStart, requested);
}

export function resolveClassesInSemester(meta: string | null, sem: SemesterRow | null, track?: string, startDateIso?: string) {
  if (track && isBjjTrackKey(track)) {
    const startIso = startDateIso ?? sem?.start_date?.trim() ?? isoDateOnly(new Date());
    const endIso = sem?.end_date?.trim();
    if (endIso) {
      const start = safeMiddayDate(startIso);
      const end = safeMiddayDate(endIso);
      if (start && end && end >= start) {
        let count = 0;
        for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
          if (BJJ_TRACK_BY_KEY[track].meetingDays.includes(weekdayName(cursor))) {
            count += 1;
          }
        }
        if (count > 0) return count;
      }
    }
  }

  const fromSem = sem?.classes_in_semester;
  if (Number.isInteger(fromSem) && fromSem! > 0) return fromSem!;
  if (!meta) return 13;
  try {
    const m = JSON.parse(meta) as { classes_in_semester?: number; classes_in_semester_default?: number };
    const n = Number(m.classes_in_semester ?? m.classes_in_semester_default);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  } catch {
    /* ignore */
  }
  return 13;
}

type LineCore = {
  scheduledClassCount: number;
  perClassCents: number;
  baseTuitionCents: number;
  trialCreditCents: number;
  registrationFeeCents: number;
  lineSubtotalCents: number;
  siblingDiscountCents: number;
  afterSiblingCents: number;
};

function linePricingCore(input: LinePricingInput): LineCore {
  const sem = input.semester;
  const startDateIso = resolveChargeStartDateIso(sem, input.chargeDateIso, Boolean(input.prorationAllowed));
  const scheduledClassCount = resolveClassesInSemester(input.priceMetadataJson, sem, input.track, startDateIso);
  const regFeeSem = sem?.registration_fee_cents ?? 0;
  const regFeePrice = input.programPriceRegFee ?? 0;
  const regFee = Number.isInteger(regFeeSem) && regFeeSem > 0 ? regFeeSem : regFeePrice;

  let perClassCents = 0;
  if (isBjjTrackKey(input.track)) {
    perClassCents =
      Math.max(0, Number(input.programPriceAmount ?? 0)) || BJJ_TRACK_BY_KEY[input.track].defaultPerClassCents;
  } else if (isKidsBjjTrack(input.track)) {
    perClassCents = sem?.price_per_class_cents ?? KIDS_PER_CLASS_CENTS_DEFAULT;
  } else {
    perClassCents = Math.max(0, Number(input.programPriceAmount ?? 0));
  }

  const baseTuitionCents = Math.max(0, perClassCents) * Math.max(0, scheduledClassCount);
  const trialCreditCents = Math.max(0, Math.min(baseTuitionCents, Math.round(Number(input.trialCreditCents ?? 0))));

  const registrationFeeCents = Math.max(0, regFee);
  const lineSubtotalCents = Math.max(0, baseTuitionCents - trialCreditCents + registrationFeeCents);

  const kidsLineIndex = input.siblingRankAmongKidsStudents;
  const afterSiblingCents = lineTotalAfterSiblingCents(kidsLineIndex, lineSubtotalCents, isKidsBjjTrack(input.track));
  const siblingDiscountCents = lineSubtotalCents - afterSiblingCents;

  return {
    scheduledClassCount,
    perClassCents,
    baseTuitionCents,
    trialCreditCents,
    registrationFeeCents,
    lineSubtotalCents,
    siblingDiscountCents,
    afterSiblingCents,
  };
}

/** Per-line tuition + fees + sibling + pay split + later date (for UI preview; server uses same math). */
export function getLinePriceBreakdown(input: LinePricingInput) {
  const core = linePricingCore(input);
  const { dueToday, dueLater } = splitPaymentPlan(core.afterSiblingCents, input.paymentChoice);
  return {
    ...core,
    classesN: core.scheduledClassCount,
    tuitionCents: core.baseTuitionCents,
    dueTodayCents: dueToday,
    dueLaterCents: dueLater,
    laterPaymentDateIso: computeLaterPaymentDateIso(input.semester),
  };
}

/**
 * Full line tuition + reg fee (before sibling / promo / pay split).
 */
export function computeLineTuitionCents(input: LinePricingInput): Omit<LinePricingResult, "dueTodayCents" | "dueLaterCents"> {
  const core = linePricingCore(input);
  return {
    scheduledClassCount: core.scheduledClassCount,
    perClassCents: core.perClassCents,
    baseTuitionCents: core.baseTuitionCents,
    trialCreditCents: core.trialCreditCents,
    classesN: core.scheduledClassCount,
    tuitionCents: core.baseTuitionCents,
    lineSubtotalCents: core.lineSubtotalCents,
    siblingDiscountCents: core.siblingDiscountCents,
    afterSiblingCents: core.afterSiblingCents,
  };
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
