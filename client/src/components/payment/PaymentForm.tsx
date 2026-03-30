import React, { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";

export function PaymentForm({
  returnUrl,
  onSuccess,
  submitDisabled = false,
}: {
  returnUrl: string;
  onSuccess?: () => void;
  submitDisabled?: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (!stripe || !elements) return;

        setSubmitting(true);
        const result = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        });

        if (result.error) {
          setError(result.error.message ?? "Payment didn't go through. Check your details and try again.");
          setSubmitting(false);
          return;
        }

        onSuccess?.();
        setSubmitting(false);
      }}
      className="space-y-4"
    >
      <DarkCard>
        <div className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em] mb-4">
          Payment Details
        </div>
        <PaymentElement />
      </DarkCard>

      {error ? <div className="text-sm font-body text-clay">{error}</div> : null}

      <ClayButton
        type="submit"
        className="w-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]"
        disabled={submitDisabled || submitting || !stripe || !elements}
      >
        {submitting ? "Processing..." : "Complete Payment"}
      </ClayButton>
    </form>
  );
}
