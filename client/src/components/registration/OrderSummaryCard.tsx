import React, { useMemo } from "react";
import { DarkCard } from "@/components/brand/DarkCard";
import type { ProgramConfig } from "@/lib/programConfig";
import { useProgramsCatalog } from "@/hooks/useProgramsCatalog";
import { formatMoneyFromCents } from "@shared/money";
import {
  getLinePriceBreakdown,
  type SemesterRow,
} from "@shared/orderPricing";
import type { BjjTrackValue } from "@/hooks/useRegistration";

const PLACEHOLDER_PRICES: Record<string, { label: string; amount: string; monthly?: boolean }> = {
  bjj: { label: "Semester tuition", amount: "TBD" },
  archery: { label: "Session fee (one-time)", amount: "TBD" },
  outdoor: { label: "Workshop fee (one-time)", amount: "TBD" },
  bullyproofing: { label: "Workshop fee (one-time)", amount: "TBD" },
};

const REG_FEE_PROGRAMS = ["bjj"];

function money(cents: number) {
  return formatMoneyFromCents(cents);
}

function formatScheduleDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function mapCatalogSemesterToRow(s: {
  classes_in_semester: number;
  price_per_class_cents: number | null;
  registration_fee_cents: number | null;
  later_payment_date: string | null;
  start_date: string | null;
  end_date: string | null;
} | null): SemesterRow | null {
  if (!s) return null;
  return {
    classes_in_semester: s.classes_in_semester,
    price_per_class_cents: s.price_per_class_cents,
    registration_fee_cents: s.registration_fee_cents,
    later_payment_date: s.later_payment_date,
    start_date: s.start_date,
    end_date: s.end_date,
  };
}

export type BjjLinePreviewInput = {
  track: BjjTrackValue;
  paymentChoice: "full" | "plan";
  priceId: number | null;
};

type Props = {
  program: ProgramConfig;
  siblingCount: 0 | 1 | 2;
  discountCode: string;
  onDiscountCodeChange: (code: string) => void;
  /** BJJ: live estimate from D1 catalog + same formulas as checkout. */
  bjjLinePreview?: BjjLinePreviewInput;
};

export function OrderSummaryCard({
  program,
  siblingCount,
  discountCode,
  onDiscountCodeChange,
  bjjLinePreview,
}: Props) {
  const { data: catalog, isLoading: catalogLoading } = useProgramsCatalog();

  const price = PLACEHOLDER_PRICES[program.slug] ?? { label: "Program fee", amount: "TBD" };
  const hasRegFee = REG_FEE_PROGRAMS.includes(program.slug);

  const bjjBreakdown = useMemo(() => {
    if (program.slug !== "bjj" || !bjjLinePreview?.track || !bjjLinePreview.priceId) return null;
    const bjj = catalog?.programs?.find((p) => p.slug === "bjj");
    if (!bjj) return null;
    const tier = bjj.prices.find((pr) => pr.id === bjjLinePreview.priceId);
    if (!tier) return null;

    const semester = mapCatalogSemesterToRow(bjj.active_semester);
    const track = bjjLinePreview.track;

    return getLinePriceBreakdown({
      track,
      priceId: tier.id,
      programPriceAmount: tier.amount,
      programPriceRegFee: tier.registration_fee,
      programPriceFrequency: tier.frequency,
      priceMetadataJson: tier.metadata,
      paymentChoice: bjjLinePreview.paymentChoice,
      siblingDiscountEligible: siblingCount > 0,
      semester,
    });
  }, [program.slug, bjjLinePreview, catalog?.programs, siblingCount]);

  const showBjjEstimate = program.slug === "bjj" && Boolean(bjjLinePreview?.track && bjjLinePreview?.priceId);

  return (
    <DarkCard className="rounded-3xl">
      <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-5">Order Summary</div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-body text-sm text-cream/90">{program.name}</div>
            <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-cream/40 mt-0.5">
              {showBjjEstimate && bjjBreakdown ? "Selected tier (estimate)" : price.label}
            </div>
          </div>
          <div className="font-mono-label text-[12px] text-cream/80 text-right whitespace-nowrap">
            {showBjjEstimate && bjjBreakdown ? (
              <span className="text-cream">{money(bjjBreakdown.afterSiblingCents)}</span>
            ) : (
              <>
                {price.amount}
                {price.monthly && <span className="text-[9px] text-cream/40">/mo</span>}
              </>
            )}
          </div>
        </div>

        {showBjjEstimate && catalogLoading && (
          <p className="font-body text-xs text-cream/50">Loading price details…</p>
        )}

        {showBjjEstimate && !catalogLoading && !bjjBreakdown && (
          <p className="font-body text-xs text-cream/50">Couldn&apos;t load catalog prices. Totals still confirm at checkout.</p>
        )}

        {showBjjEstimate && bjjBreakdown && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-body text-sm text-cream/90">Tuition</div>
                <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-cream/40 mt-0.5">
                  {bjjBreakdown.perClassCents != null
                    ? `${bjjBreakdown.classesN} classes × ${money(bjjBreakdown.perClassCents)}`
                    : `${bjjBreakdown.classesN} sessions × tier rate`}
                </div>
              </div>
              <div className="font-mono-label text-[12px] text-cream/80">{money(bjjBreakdown.tuitionCents)}</div>
            </div>

            {hasRegFee && bjjBreakdown.registrationFeeCents > 0 && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-body text-sm text-cream/90">Registration fee</div>
                  <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-cream/40 mt-0.5">
                    One-time (this line)
                  </div>
                </div>
                <div className="font-mono-label text-[12px] text-cream/80">{money(bjjBreakdown.registrationFeeCents)}</div>
              </div>
            )}

            {bjjBreakdown.siblingDiscountCents > 0 && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-body text-sm text-moss">Sibling discount</div>
                  <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-moss/60 mt-0.5">
                    Child sibling line · −10%
                  </div>
                </div>
                <div className="font-mono-label text-[12px] text-moss">−{money(bjjBreakdown.siblingDiscountCents)}</div>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 border-t border-cream/10 pt-2">
              <div className="font-body text-sm text-cream/70">Line total (estimate)</div>
              <div className="font-mono-label text-[12px] text-cream">{money(bjjBreakdown.afterSiblingCents)}</div>
            </div>

            {bjjLinePreview?.paymentChoice === "plan" && bjjBreakdown.dueLaterCents > 0 && (
              <div className="rounded-xl bg-white/5 px-3 py-2 space-y-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-body text-cream/80">Pay today</span>
                  <span className="font-mono-label text-cream">{money(bjjBreakdown.dueTodayCents)}</span>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-body text-cream/80">Second installment</span>
                  <span className="font-mono-label text-cream">{money(bjjBreakdown.dueLaterCents)}</span>
                </div>
                {formatScheduleDate(bjjBreakdown.laterPaymentDateIso) && (
                  <p className="font-body text-[11px] text-cream/45 pt-1">
                    Second charge date: <span className="text-cream/70">{formatScheduleDate(bjjBreakdown.laterPaymentDateIso)}</span>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {!showBjjEstimate && hasRegFee && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-sm text-cream/90">Registration fee</div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-cream/40 mt-0.5">One-time</div>
            </div>
            <div className="font-mono-label text-[12px] text-cream/80">TBD</div>
          </div>
        )}

        {!showBjjEstimate && siblingCount > 0 && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-sm text-moss">Sibling discount</div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-moss/60 mt-0.5">
                {siblingCount} sibling{siblingCount > 1 ? "s" : ""} indicated · child sibling lines −10%
              </div>
            </div>
            <div className="font-mono-label text-[12px] text-moss">At checkout</div>
          </div>
        )}

        <div className="border-t border-cream/10 pt-3 flex items-center justify-between">
          <div className="font-body text-sm text-cream/60">Total</div>
          <div className="font-heading text-lg text-cream">
            {showBjjEstimate && bjjBreakdown ? money(bjjBreakdown.afterSiblingCents) : "Confirmed at checkout"}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-cream/10">
        <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-cream/40 mb-2">Promo / discount code</div>
        <div className="space-y-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
            placeholder="E.g. SIBLING10"
            className="w-full rounded-xl bg-white/8 border border-cream/15 px-3 py-2 text-sm font-body text-cream placeholder:text-cream/25 focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay/30 transition-colors"
          />
        </div>
        <p className="font-body text-xs text-cream/45 mt-1">
          Enter a code here if staff gave you one. It will be validated by the live payment endpoint before any charge is created.
        </p>
      </div>

      <div className="mt-5 rounded-xl bg-white/5 px-4 py-3">
        <p className="font-body text-xs text-cream/40 leading-relaxed">
          Final amounts are calculated server-side. Totals shown at the Stripe payment screen are authoritative.
        </p>
      </div>
    </DarkCard>
  );
}
