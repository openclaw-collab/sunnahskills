import React from "react";
import type { RegistrationStepProps } from "@/components/registration/steps";
import type { ProgramConfig } from "@/lib/programConfig";
import { PaymentProvider } from "@/components/payment/PaymentProvider";
import { PaymentForm } from "@/components/payment/PaymentForm";
import { OrderSummaryCard } from "./OrderSummaryCard";

type Props = RegistrationStepProps & {
  clientSecret?: string | null;
  returnUrl: string;
  program: ProgramConfig;
};

export function StepPayment({ draft, updateDraft, clientSecret, returnUrl, program }: Props) {
  return (
    <div className="space-y-6">
      {/* Order summary shown above Stripe element */}
      <OrderSummaryCard
        program={program}
        siblingCount={draft.programDetails.siblingCount}
        discountCode={draft.payment.discountCode}
        onDiscountCodeChange={(code) =>
          updateDraft((prev) => ({ ...prev, payment: { ...prev.payment, discountCode: code } }))
        }
      />

      {clientSecret ? (
        <PaymentProvider clientSecret={clientSecret}>
          <PaymentForm returnUrl={returnUrl} />
        </PaymentProvider>
      ) : (
        <div className="rounded-2xl border border-charcoal/10 bg-cream p-6 text-center">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/40 mb-2">
            Payment
          </div>
          <p className="font-body text-sm text-charcoal/60">
            Loading payment form…
          </p>
        </div>
      )}
    </div>
  );
}
