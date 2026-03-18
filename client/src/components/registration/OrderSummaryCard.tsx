import React, { useState } from "react";
import { DarkCard } from "@/components/brand/DarkCard";
import type { ProgramConfig } from "@/lib/programConfig";

const SIBLING_DISCOUNT_PERCENT = 10;

const PLACEHOLDER_PRICES: Record<string, { label: string; amount: string; monthly?: boolean }> = {
  bjj: { label: "Monthly tuition", amount: "TBD", monthly: true },
  archery: { label: "Session fee (one-time)", amount: "TBD" },
  outdoor: { label: "Workshop fee (one-time)", amount: "TBD" },
  bullyproofing: { label: "Workshop fee (one-time)", amount: "TBD" },
};

const REG_FEE_PROGRAMS = ["bjj"];

type Props = {
  program: ProgramConfig;
  siblingCount: 0 | 1 | 2;
  discountCode: string;
  onDiscountCodeChange: (code: string) => void;
};

export function OrderSummaryCard({ program, siblingCount, discountCode, onDiscountCodeChange }: Props) {
  const [promoApplied, setPromoApplied] = useState(false);
  const price = PLACEHOLDER_PRICES[program.slug] ?? { label: "Program fee", amount: "TBD" };
  const hasRegFee = REG_FEE_PROGRAMS.includes(program.slug);
  const hasSiblingDiscount = siblingCount > 0;

  return (
    <DarkCard className="rounded-3xl">
      <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-5">
        Order Summary
      </div>

      <div className="space-y-3">
        {/* Program fee */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-body text-sm text-cream/90">{program.name}</div>
            <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-cream/40 mt-0.5">
              {price.label}
            </div>
          </div>
          <div className="font-mono-label text-[12px] text-cream/80 text-right whitespace-nowrap">
            {price.amount}
            {price.monthly && <span className="text-[9px] text-cream/40">/mo</span>}
          </div>
        </div>

        {/* One-time reg fee for BJJ */}
        {hasRegFee && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-sm text-cream/90">Registration fee</div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-cream/40 mt-0.5">
                One-time
              </div>
            </div>
            <div className="font-mono-label text-[12px] text-cream/80">TBD</div>
          </div>
        )}

        {/* Sibling discount */}
        {hasSiblingDiscount && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-sm text-moss">Sibling discount</div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-moss/60 mt-0.5">
                {siblingCount} sibling{siblingCount > 1 ? "s" : ""} · −{SIBLING_DISCOUNT_PERCENT}%
              </div>
            </div>
            <div className="font-mono-label text-[12px] text-moss">−{SIBLING_DISCOUNT_PERCENT}%</div>
          </div>
        )}

        {/* Promo code line */}
        {promoApplied && discountCode && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-body text-sm text-moss">Promo code</div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-moss/60 mt-0.5">
                {discountCode}
              </div>
            </div>
            <div className="font-mono-label text-[12px] text-moss">Applied</div>
          </div>
        )}

        <div className="border-t border-cream/10 pt-3 flex items-center justify-between">
          <div className="font-body text-sm text-cream/60">Total</div>
          <div className="font-heading text-lg text-cream">Confirmed at checkout</div>
        </div>
      </div>

      {/* Promo code input */}
      <div className="mt-5 pt-5 border-t border-cream/10">
        <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-cream/40 mb-2">
          Promo / discount code
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => {
              onDiscountCodeChange(e.target.value.toUpperCase());
              setPromoApplied(false);
            }}
            placeholder="E.g. SIBLING10"
            className="flex-1 rounded-xl bg-white/8 border border-cream/15 px-3 py-2 text-sm font-body text-cream placeholder:text-cream/25 focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay/30 transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              if (discountCode.trim()) setPromoApplied(true);
            }}
            className="rounded-xl bg-clay/20 border border-clay/30 px-3 py-2 font-mono-label text-[9px] uppercase tracking-[0.15em] text-clay hover:bg-clay/30 transition-colors whitespace-nowrap"
          >
            Apply
          </button>
        </div>
        {promoApplied && (
          <p className="font-body text-xs text-moss mt-1">Code applied — discount confirmed at checkout.</p>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-white/5 px-4 py-3">
        <p className="font-body text-xs text-cream/40 leading-relaxed">
          Final amounts are calculated server-side. Totals shown at the Stripe payment screen are authoritative.
        </p>
      </div>
    </DarkCard>
  );
}
