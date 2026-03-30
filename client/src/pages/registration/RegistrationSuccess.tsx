import React from "react";
import { Link, useSearch } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

const NEXT_STEPS = [
  {
    n: "01",
    title: "Placement confirmation",
    body: "We review your details and confirm your class group, session time, and age tier within 1–2 business days.",
  },
  {
    n: "02",
    title: "What-to-bring details",
    body: "You'll receive an email with everything you need: location, start time, gear list, and what to expect on day one.",
  },
  {
    n: "03",
    title: "First class",
    body: "Arrive 10 minutes early. Coaches will introduce themselves, walk you through the space, and get your child started.",
  },
];

export default function RegistrationSuccess() {
  const search = useSearch();
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const rid = params.get("rid");
  const orderId = Number(params.get("order") ?? 0);
  const paymentIntentId = params.get("payment_intent");
  const reconcileToken = params.get("reconcile_token");
  const [reconcileState, setReconcileState] = React.useState<"idle" | "loading" | "done" | "pending" | "failed">(
    Number.isInteger(orderId) && orderId > 0 ? "loading" : "idle",
  );
  const [reconcileMessage, setReconcileMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Number.isInteger(orderId) || orderId <= 0) return;

    let active = true;

    (async () => {
      try {
        setReconcileState("loading");
        setReconcileMessage(null);

        const res = await fetch("/api/payments/reconcile-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentOrderId: orderId,
            paymentIntentId: paymentIntentId ?? undefined,
            reconcileToken: reconcileToken ?? undefined,
          }),
        });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; reconciled?: boolean; paymentStatus?: string; error?: string }
          | null;

        if (!active) return;
        if (!res.ok) {
          setReconcileState("failed");
          setReconcileMessage(json?.error ?? "We received your registration, but we're still confirming payment status.");
          return;
        }

        if (json?.ok === false || (json?.paymentStatus && json.paymentStatus !== "succeeded")) {
          setReconcileState("pending");
          setReconcileMessage("Your payment is still processing. If you were charged, we’ll confirm your enrollment shortly.");
          return;
        }

        setReconcileState("done");
      } catch {
        if (!active) return;
        setReconcileState("failed");
        setReconcileMessage("We received your registration, but we're still confirming payment status.");
      }
    })();

    return () => {
      active = false;
    };
  }, [orderId, paymentIntentId, reconcileToken]);

  const eyebrow =
    reconcileState === "loading"
      ? "Finalizing Registration"
      : reconcileState === "pending"
        ? "Payment Processing"
        : "Registration Complete";
  const title =
    reconcileState === "loading"
      ? "We're confirming your enrollment."
      : reconcileState === "pending"
        ? "Your payment is still processing."
        : "You're enrolled.";
  const subtitle =
    reconcileState === "loading"
      ? "One moment while we finish syncing your payment and registration."
      : reconcileState === "pending"
        ? reconcileMessage ?? "Your payment is still processing. We'll confirm everything shortly."
        : reconcileState === "failed"
          ? reconcileMessage ?? "We received your registration and are checking payment status now."
          : "Payment confirmed. We'll be in touch with everything you need to get started.";

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-2xl mx-auto px-6 pt-28">

        {/* Checkmark */}
        <MotionDiv delay={0.02} className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-clay/10 border-2 border-clay/30 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 16L13 23L26 9"
                stroke="#CE5833"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </MotionDiv>

        <MotionDiv delay={0.06} className="text-center mb-10">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-3">
            {eyebrow}
          </div>
          <h1 className="font-heading text-4xl text-charcoal mb-3">
            {title}
          </h1>
          <p className="font-body text-sm text-charcoal/60 max-w-sm mx-auto">
            {subtitle}
          </p>
          {rid && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-4 py-2">
              <span className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/40">Reg ID</span>
              <span className="font-mono-label text-[11px] text-charcoal">#{rid}</span>
            </div>
          )}
        </MotionDiv>

        {/* What happens next */}
        {reconcileState !== "loading" && reconcileState !== "pending" ? (
          <MotionDiv delay={0.1}>
            <DarkCard className="rounded-3xl mb-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-6">
              What happens next
            </div>
            <div className="space-y-6">
              {NEXT_STEPS.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="font-mono-label text-[11px] text-clay flex-none mt-0.5">{step.n}</div>
                  <div>
                    <div className="font-body text-sm text-cream/90 font-medium mb-1">{step.title}</div>
                    <p className="font-body text-xs text-cream/55 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
            </DarkCard>
          </MotionDiv>
        ) : (
          <MotionDiv delay={0.1}>
            <PremiumCard className="bg-white border border-charcoal/10 mb-6">
              <p className="font-body text-sm text-charcoal/65">
                If your card was charged and this page does not update within a minute, we’ll still be able to reconcile the payment from Stripe on our side.
              </p>
            </PremiumCard>
          </MotionDiv>
        )}

        <MotionDiv delay={0.14}>
          <PremiumCard className="bg-white border border-charcoal/10">
          <p className="font-body text-sm text-charcoal/60 mb-5">
            Questions before your first class? We're happy to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <ClayButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/programs">Explore Programs</Link>
            </ClayButton>
            <OutlineButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/contact">Contact Us</Link>
            </OutlineButton>
          </div>
          </PremiumCard>
        </MotionDiv>
      </main>
    </MotionPage>
  );
}
