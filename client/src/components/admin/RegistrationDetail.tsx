import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_CURRENCY_DISPLAY, formatMoneyFromCents } from "@shared/money";
import { summarizePaymentLifecycle } from "@/components/admin/paymentLifecycle";
import { cn } from "@/lib/utils";

type Detail = Record<string, any>;

function row(label: string, value: React.ReactNode) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-charcoal/5 py-2.5 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
        {label}
      </div>
      <div className="min-w-0 text-sm leading-relaxed text-charcoal">{value}</div>
    </div>
  );
}

function registrationBadgeClass(value?: string | null) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-mono-label";
  if (value === "active") return `${base} border-moss/20 bg-moss/10 text-moss`;
  if (value === "pending_payment") return `${base} border-gold/40 bg-gold/18 text-charcoal`;
  if (value === "waitlisted") return `${base} border-clay/25 bg-clay/10 text-clay`;
  if (value === "cancelled") return `${base} border-charcoal/10 bg-charcoal/5 text-charcoal/55`;
  return `${base} border-charcoal/10 bg-charcoal/5 text-charcoal/70`;
}

function paymentBadgeClass(variant?: string | null) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-mono-label";
  if (variant === "paid_full") return `${base} border-moss bg-moss text-cream`;
  if (variant === "paid_partial") return `${base} border-gold/55 border-[1.5px] bg-moss/12 text-moss`;
  if (variant === "failed") return `${base} border-clay bg-clay text-cream`;
  if (variant === "pending") return `${base} border-gold/40 bg-gold/18 text-charcoal`;
  if (variant === "superseded" || variant === "cancelled") return `${base} border-charcoal/10 bg-charcoal/5 text-charcoal/55`;
  return `${base} border-charcoal/10 bg-charcoal/5 text-charcoal/70`;
}

function detailCardTone(variant?: string | null) {
  if (variant === "paid_full") return "border-moss/15 bg-moss/[0.05]";
  if (variant === "paid_partial") return "border-gold/30 bg-cream/55";
  if (variant === "failed") return "border-clay/18 bg-clay/[0.05]";
  if (variant === "pending") return "border-gold/25 bg-gold/[0.08]";
  return "border-charcoal/10 bg-white";
}

function summaryMetric(label: string, value: React.ReactNode, tone?: string) {
  return (
    <div className={cn("rounded-[1.4rem] border border-charcoal/10 bg-cream/40 px-4 py-3", tone)}>
      <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/45">{label}</div>
      <div className="mt-1 text-base font-medium text-charcoal">{value}</div>
    </div>
  );
}

export function RegistrationDetail({
  registrationId,
  open,
  onOpenChange,
  onUpdated,
}: {
  registrationId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<string>("submitted");
  const [adminNotes, setAdminNotes] = useState<string>("");

  useEffect(() => {
    if (!open || !registrationId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/registrations/${registrationId}`);
        const json = (await res.json().catch(() => null)) as any;
        const r = json?.registration ?? null;
        setDetail(r);
        setStatus(r?.status ?? "submitted");
        setAdminNotes(r?.admin_notes ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, registrationId]);

  const title = useMemo(() => {
    if (!detail) return "Registration";
    return `${detail.student_full_name ?? "Student"} • ${detail.program_name ?? "Program"} • #${detail.id}`;
  }, [detail]);

  const paymentLifecycle = useMemo(() => {
    if (!detail) return null;
    return summarizePaymentLifecycle({
      orderStatus: detail.order_status,
      latestPaymentStatus: detail.payment_status,
      manualReviewStatus: detail.order_manual_review_status,
      manualReviewReason: detail.order_manual_review_reason,
      lastPaymentError: detail.order_last_payment_error,
      totalCents: detail.order_total_cents,
      amountDueTodayCents: detail.order_amount_due_today_cents ?? detail.payment_amount,
      laterAmountCents: detail.order_later_amount_cents,
      laterPaymentDate: detail.order_later_payment_date,
      latestPaymentAmountCents: detail.payment_amount,
      currency: detail.payment_currency,
    });
  }, [detail]);

  const paymentCurrency = detail?.payment_currency ?? DEFAULT_CURRENCY_DISPLAY;
  const orderTotal = detail?.order_total_cents != null
    ? formatMoneyFromCents(Number(detail.order_total_cents), { currency: paymentCurrency })
    : "—";
  const dueToday = detail?.order_amount_due_today_cents != null
    ? formatMoneyFromCents(Number(detail.order_amount_due_today_cents), { currency: paymentCurrency })
    : "—";
  const laterBalance = detail?.order_later_amount_cents
    ? formatMoneyFromCents(Number(detail.order_later_amount_cents), { currency: paymentCurrency })
    : null;
  const latestPaymentAmount = detail?.payment_amount != null
    ? formatMoneyFromCents(Number(detail.payment_amount), { currency: paymentCurrency })
    : "—";

  async function save() {
    if (!registrationId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Update failed");
      onUpdated();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(96vh,58rem)] w-[calc(100vw-1rem)] max-w-[72rem] flex-col gap-0 overflow-hidden rounded-[1.8rem] border border-charcoal/10 bg-cream p-0 shadow-[0_30px_90px_rgba(26,26,26,0.18)] sm:h-[min(94vh,60rem)] sm:w-[min(96vw,72rem)] sm:rounded-[2rem]">
        <DialogHeader className="shrink-0 border-b border-charcoal/10 bg-cream/95 px-4 py-4 text-left backdrop-blur-sm sm:px-6 sm:py-5">
          <DialogTitle className="pr-8 font-display text-lg leading-tight text-charcoal sm:text-[1.45rem]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-charcoal/65">
            Review the payment state, family details, waivers, and internal notes for this registration.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="text-sm text-charcoal/70">Loading…</div>
            </PremiumCard>
          </div>
        ) : !detail ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="text-sm text-charcoal/70">No detail available.</div>
            </PremiumCard>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              <div className="space-y-4">
            <PremiumCard className={cn("border p-4 sm:p-6", detailCardTone(paymentLifecycle?.statusVariant))}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                    Registration overview
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={registrationBadgeClass(detail.status)}>{detail.status ?? "unknown"}</span>
                    <span className={paymentBadgeClass(paymentLifecycle?.statusVariant)}>{paymentLifecycle?.compactLabel ?? "—"}</span>
                    {detail.order_id ? (
                      <span className="inline-flex items-center rounded-full border border-charcoal/10 bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-mono-label text-charcoal/60">
                        Order #{detail.order_id}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/72">
                    {paymentLifecycle?.detail ?? "No payment summary is available yet."}
                  </p>
                </div>

                <div className="w-full rounded-[1.6rem] border border-charcoal/10 bg-white px-4 py-4 sm:w-[18rem] sm:flex-none">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                    Internal actions
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="font-body text-sm text-charcoal">Status</div>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="border-charcoal/10 bg-cream/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">submitted</SelectItem>
                        <SelectItem value="pending_payment">pending_payment</SelectItem>
                        <SelectItem value="paid">paid</SelectItem>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="waitlisted">waitlisted</SelectItem>
                        <SelectItem value="cancelled">cancelled</SelectItem>
                        <SelectItem value="refunded">refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryMetric("Order total", orderTotal)}
                {summaryMetric("Due today", dueToday)}
                {summaryMetric(
                  "Later balance",
                  laterBalance ? `${laterBalance} · ${detail.order_later_payment_date ?? "TBD"}` : "No later balance",
                  paymentLifecycle?.statusVariant === "paid_partial" ? "border-gold/30 bg-white" : undefined,
                )}
                {summaryMetric("Latest payment", latestPaymentAmount)}
              </div>
            </PremiumCard>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
              <PremiumCard className="border border-charcoal/10 bg-white p-4 sm:p-6">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                  Family & student
                </div>
                {row("Guardian", detail.guardian_full_name)}
                {row("Email", detail.guardian_email)}
                {row("Phone", detail.guardian_phone)}
                {row("Emergency", `${detail.guardian_emergency_contact_name ?? "—"} • ${detail.guardian_emergency_contact_phone ?? "—"}`)}
                {row("Relationship", detail.guardian_relationship ?? "—")}
                {row("Student", `${detail.student_full_name ?? "—"} (${detail.student_preferred_name ?? "—"})`)}
                {row("DOB / Age", `${detail.student_dob ?? "—"} • ${detail.student_age ?? "—"}`)}
                {row("Gender", detail.student_gender ?? "—")}
                {row("Experience", detail.student_prior_experience ?? "—")}
                {row("Skill level", detail.student_skill_level ?? "—")}
                {row("Medical notes", detail.student_medical_notes ?? "—")}
              </PremiumCard>

              <div className="space-y-4">
                <PremiumCard className="border border-charcoal/10 bg-white p-4 sm:p-6">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                    Payment detail
                  </div>
                  {row("Order", detail.order_id ? `#${detail.order_id} · ${detail.order_status ?? "—"}` : "—")}
                  {row("Payment status", detail.payment_status ?? "unpaid")}
                  {row("Currency", detail.payment_currency ? String(detail.payment_currency).toUpperCase() : DEFAULT_CURRENCY_DISPLAY)}
                  {row("Stripe PI", detail.stripe_payment_intent_id ?? "—")}
                  {row("Manual review", paymentLifecycle?.reviewHeadline ?? detail.order_manual_review_status ?? "none")}
                  {row("Review reason", paymentLifecycle?.reviewDetail ?? detail.order_manual_review_reason ?? detail.order_last_payment_error ?? "—")}
                </PremiumCard>

                <PremiumCard className="border border-charcoal/10 bg-white p-4 sm:p-6">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                    Waivers
                  </div>
                  {row("Liability", detail.waiver_liability_waiver ? "Yes" : "No")}
                  {row("Photo consent", detail.waiver_photo_consent ? "Yes" : "No")}
                  {row("Medical consent", detail.waiver_medical_consent ? "Yes" : "No")}
                  {row("Terms", detail.waiver_terms_agreement ? "Yes" : "No")}
                  {row("Signature", detail.waiver_signature_text ?? "—")}
                  {row("Signed at", detail.waiver_signed_at ?? "—")}
                </PremiumCard>

                <PremiumCard className="border border-charcoal/10 bg-white p-4 sm:p-6">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                    Admin notes
                  </div>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[8rem] border-charcoal/10 bg-cream/50"
                    placeholder="Internal notes…"
                  />
                </PremiumCard>
              </div>
            </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-charcoal/10 bg-cream/92 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <OutlineButton
                className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Close
              </OutlineButton>
              <ClayButton
                className="w-full px-6 py-2.5 text-[11px] uppercase tracking-[0.18em] sm:w-auto"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </ClayButton>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
