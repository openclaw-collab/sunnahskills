import React from "react";
import { Input } from "@/components/ui/input";
import type { RegistrationStepProps } from "@/components/registration/steps";
import { DarkCard } from "@/components/brand/DarkCard";
import { PaymentProvider } from "@/components/payment/PaymentProvider";
import { PaymentForm } from "@/components/payment/PaymentForm";

export function StepPayment({
  draft,
  updateDraft,
  clientSecret,
  returnUrl,
}: RegistrationStepProps & { clientSecret?: string | null; returnUrl: string }) {
  return (
    <div className="space-y-6">
      <DarkCard>
        <div className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
          Payment (Stripe Elements)
        </div>
        <p className="mt-3 text-sm font-body text-cream/75 max-w-2xl">
          Complete payment in-app. Totals are calculated server-side from program pricing and any validated discounts.
        </p>
      </DarkCard>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Promo / discount code (optional)</label>
        <Input
          value={draft.payment.discountCode}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              payment: { ...prev.payment, discountCode: e.target.value.toUpperCase() },
            }))
          }
          placeholder="E.g. SIBLING10"
        />
      </div>

      {clientSecret ? (
        <PaymentProvider clientSecret={clientSecret}>
          <PaymentForm returnUrl={returnUrl} />
        </PaymentProvider>
      ) : (
        <div className="text-sm font-body text-charcoal/70">
          Loading payment form…
        </div>
      )}
    </div>
  );
}

