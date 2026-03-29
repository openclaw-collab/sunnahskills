import { formatMoneyFromCents } from "@shared/money";

type PaymentLifecycleInput = {
  orderStatus?: string | null;
  latestPaymentStatus?: string | null;
  manualReviewStatus?: string | null;
  manualReviewReason?: string | null;
  lastPaymentError?: string | null;
  totalCents?: number | null;
  amountDueTodayCents?: number | null;
  laterAmountCents?: number | null;
  laterPaymentDate?: string | null;
  paidCents?: number | null;
  latestPaymentAmountCents?: number | null;
  currency?: string | null;
};

export type PaymentLifecycleSummary = {
  headline: string;
  detail: string;
  compactLabel: string;
  compactDetail: string;
  statusTone: "success" | "warning" | "danger" | "muted";
  statusVariant: "paid_full" | "paid_partial" | "pending" | "failed" | "superseded" | "cancelled";
  reviewHeadline: string;
  reviewDetail: string;
};

function money(amountCents: number, currency = "cad") {
  return formatMoneyFromCents(amountCents, { currency });
}

function safeAmount(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function humanizeStatus(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ");
}

function formatChargeDate(value?: string | null) {
  if (!value) return "TBD";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function summarizePaymentLifecycle(input: PaymentLifecycleInput): PaymentLifecycleSummary {
  const orderStatus = input.orderStatus ?? "";
  const latestPaymentStatus = input.latestPaymentStatus ?? "";
  const manualReviewStatus = input.manualReviewStatus ?? "";
  const manualReviewReason = input.manualReviewReason?.trim() ?? "";
  const lastPaymentError = input.lastPaymentError?.trim() ?? "";
  const currency = input.currency ?? "cad";
  const totalCents = safeAmount(input.totalCents);
  const amountDueTodayCents = safeAmount(input.amountDueTodayCents);
  const laterAmountCents = safeAmount(input.laterAmountCents);
  const paidCents = safeAmount(input.paidCents);
  const latestPaymentAmountCents = safeAmount(input.latestPaymentAmountCents);
  const collectedCents = paidCents || latestPaymentAmountCents || amountDueTodayCents;
  const laterDate = formatChargeDate(input.laterPaymentDate);

  let headline = "Unpaid checkout";
  let detail = `Due today ${money(amountDueTodayCents, currency)}.`;
  let statusTone: PaymentLifecycleSummary["statusTone"] = "warning";
  let statusVariant: PaymentLifecycleSummary["statusVariant"] = "pending";

  if (orderStatus === "superseded") {
    headline = "Superseded stale attempt";
    detail = "A newer unpaid checkout replaced this one. Ignore this attempt.";
    statusTone = "muted";
    statusVariant = "superseded";
  } else if (orderStatus === "cancelled") {
    headline = "Cancelled";
    detail = "This checkout is no longer active.";
    statusTone = "muted";
    statusVariant = "cancelled";
  } else if (latestPaymentStatus === "failed" || latestPaymentStatus === "canceled") {
    headline = "Failed";
    detail = lastPaymentError || "The payment attempt did not complete.";
    statusTone = "danger";
    statusVariant = "failed";
  } else if (orderStatus === "partially_paid" || ((latestPaymentStatus === "paid" || latestPaymentStatus === "succeeded") && laterAmountCents > 0)) {
    headline = "Half paid";
    detail = `Collected ${money(collectedCents, currency)} today. Remaining ${money(laterAmountCents, currency)} will be charged on ${laterDate}.`;
    statusTone = "success";
    statusVariant = "paid_partial";
  } else if (
    orderStatus === "paid" ||
    ((latestPaymentStatus === "paid" || latestPaymentStatus === "succeeded") && laterAmountCents <= 0)
  ) {
    headline = "Paid in full";
    detail = `Collected ${money(collectedCents || totalCents, currency)}. No later balance remains.`;
    statusTone = "success";
    statusVariant = "paid_full";
  } else if (latestPaymentStatus === "requires_payment_method") {
    headline = "Unpaid";
    detail = laterAmountCents > 0
      ? `First charge is ${money(amountDueTodayCents, currency)} today, then ${money(laterAmountCents, currency)} on ${laterDate}.`
      : `Ready to charge ${money(amountDueTodayCents || totalCents, currency)} once card details are entered.`;
    statusTone = "warning";
    statusVariant = "pending";
  } else if (latestPaymentStatus === "requires_confirmation" || latestPaymentStatus === "requires_action") {
    headline = "Unpaid";
    detail = "The checkout was started, but the payment was not fully confirmed yet.";
    statusTone = "warning";
    statusVariant = "pending";
  }

  let reviewHeadline = "No review flag";
  let reviewDetail = "No manual review note.";
  if (manualReviewStatus === "required") {
    reviewHeadline = "Needs manual review";
    reviewDetail = manualReviewReason || lastPaymentError || "Review this order before taking action.";
  } else if (manualReviewStatus === "resolved") {
    reviewHeadline = "Review resolved";
    reviewDetail = manualReviewReason || "This order was reviewed and cleared.";
  } else if (orderStatus === "superseded") {
    reviewHeadline = "Archived stale attempt";
    reviewDetail = manualReviewReason || "This attempt was replaced by a newer unpaid checkout.";
  } else if (manualReviewReason || lastPaymentError) {
    reviewHeadline = humanizeStatus(manualReviewStatus || "noted");
    reviewDetail = manualReviewReason || lastPaymentError;
  }

  let compactLabel = headline;
  let compactDetail = detail;

  if (headline === "Half paid") {
    compactLabel = "Half paid";
    compactDetail = laterAmountCents > 0
      ? `Later ${money(laterAmountCents, currency)} on ${laterDate}.`
      : "No later balance.";
  } else if (headline === "Paid in full") {
    compactLabel = "Paid in full";
    compactDetail = "Fully collected.";
  } else if (headline === "Superseded stale attempt") {
    compactLabel = "Superseded";
    compactDetail = "Replaced by a newer checkout.";
  } else if (headline === "Unpaid") {
    compactLabel = "Unpaid";
    compactDetail = "Card details were not completed yet.";
    if (latestPaymentStatus === "requires_confirmation" || latestPaymentStatus === "requires_action") {
      compactDetail = "Checkout started but not finished.";
    }
  } else if (headline === "Failed") {
    compactLabel = "Failed";
    compactDetail = lastPaymentError || "The payment did not complete.";
  }

  return { headline, detail, compactLabel, compactDetail, statusTone, statusVariant, reviewHeadline, reviewDetail };
}
