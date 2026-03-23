import React from "react";
import { Link, useLocation } from "wouter";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { MotionPage } from "@/components/motion/PageMotion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  loadFamilyCart,
  removeCartLine,
  clearFamilyCart,
  type FamilyCart,
} from "@/lib/familyCart";
import { PaymentProvider } from "@/components/payment/PaymentProvider";
import { PaymentForm } from "@/components/payment/PaymentForm";
import type { RegistrationDraft } from "@/hooks/useRegistration";

function trackLabel(track: string) {
  const map: Record<string, string> = {
    "girls-5-10": "Girls 5–10",
    "boys-7-13": "Boys 7–13",
    "women-11-tue": "Women 11+ (Tue)",
    "women-11-thu": "Women 11+ (Thu)",
    "men-14": "Men 14+",
  };
  return map[track] ?? track;
}

export default function CartPage() {
  const [, navigate] = useLocation();
  const [cart, setCart] = React.useState<FamilyCart | null>(() => loadFamilyCart());
  const [discountCode, setDiscountCode] = React.useState("");
  const [waivers, setWaivers] = React.useState<RegistrationDraft["waivers"]>({
    liabilityWaiver: false,
    photoConsent: false,
    medicalConsent: false,
    termsAgreement: false,
    signatureText: "",
    signedAt: new Date().toISOString().slice(0, 10),
  });
  const [phase, setPhase] = React.useState<"review" | "checkout" | "pay">("review");
  const [enrollmentOrderId, setEnrollmentOrderId] = React.useState<number | null>(null);
  const [firstRegistrationId, setFirstRegistrationId] = React.useState<number | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<{
    dueTodayCents: number;
    dueLaterCents: number;
    laterPaymentDate: string | null;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function refreshCart() {
    setCart(loadFamilyCart());
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-2xl px-6 pt-28">
          <SectionHeader eyebrow="Registration" title="Your cart" className="mb-6" />
          <PremiumCard className="space-y-4 border border-charcoal/10 bg-white p-8">
            <p className="font-body text-sm leading-relaxed text-charcoal/75">
              Your cart is empty. Add a Brazilian Jiu-Jitsu enrollment from the program page, or register a single student in
              one guided flow.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/programs/bjj/register">Register for BJJ</Link>
              </ClayButton>
              <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register">All programs</Link>
              </OutlineButton>
            </div>
          </PremiumCard>
        </main>
      </MotionPage>
    );
  }

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/registration/success?rid=${firstRegistrationId ?? ""}&order=${enrollmentOrderId ?? ""}`
      : "/registration/success";

  async function submitCheckout() {
    setError(null);
    if (
      !waivers.liabilityWaiver ||
      !waivers.medicalConsent ||
      !waivers.termsAgreement ||
      !waivers.signatureText.trim() ||
      !waivers.signedAt
    ) {
      setError("Please complete all waivers and sign before paying.");
      return;
    }

    setLoading(true);
    try {
      const regRes = await fetch("/api/register/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardian: cart.guardian,
          lines: cart.lines.map((l) => ({
            student: l.student,
            programDetails: {
              sessionId: l.programDetails.sessionId,
              priceId: l.programDetails.priceId,
              preferredStartDate: l.programDetails.preferredStartDate ?? "",
              scheduleChoice: l.programDetails.scheduleChoice ?? "",
              programSpecific: l.programDetails.programSpecific,
            },
            paymentChoice: l.programDetails.paymentChoice === "plan" ? "plan" : "full",
          })),
          waivers,
        }),
      });
      const regJson = (await regRes.json().catch(() => null)) as any;
      if (!regRes.ok) {
        throw new Error(regJson?.error ?? "Could not submit enrollments");
      }
      if (regJson?.summary?.waitlisted) {
        clearFamilyCart();
        navigate(`/registration/waitlist?pos=1&program=${encodeURIComponent("Brazilian Jiu-Jitsu")}`);
        return;
      }
      const oid = Number(regJson?.enrollmentOrderId);
      const rids = regJson?.registrationIds as number[] | undefined;
      if (!Number.isInteger(oid) || oid <= 0) {
        throw new Error("Invalid order response");
      }
      setEnrollmentOrderId(oid);
      setFirstRegistrationId(Array.isArray(rids) && rids.length ? rids[0]! : null);

      const payRes = await fetch("/api/payments/create-order-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentOrderId: oid,
          discountCode: discountCode.trim() || undefined,
        }),
      });
      const payJson = (await payRes.json().catch(() => null)) as any;
      if (!payRes.ok || !payJson?.clientSecret) {
        throw new Error(payJson?.error ?? "Could not start payment");
      }
      setClientSecret(payJson.clientSecret as string);
      setSummary({
        dueTodayCents: Number(payJson.dueTodayCents ?? 0),
        dueLaterCents: Number(payJson.dueLaterCents ?? 0),
        laterPaymentDate: payJson.laterPaymentDate ?? null,
      });
      setPhase("pay");
      clearFamilyCart();
      setCart(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-2xl px-6 pt-28">
        <SectionHeader eyebrow="Registration" title="Family cart" className="mb-6" />
        <p className="font-body text-sm text-charcoal/70 mb-6">
          One set of waivers covers every line in this order. Totals are calculated on the server when you pay.
        </p>

        {phase === "review" ? (
          <PremiumCard className="space-y-6 border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Guardian</div>
            <p className="font-body text-sm text-charcoal">
              {cart.guardian.fullName} · {cart.guardian.email}
            </p>

            <div className="space-y-4">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Enrollments</div>
              {cart.lines.map((line) => {
                const ps = line.programDetails.programSpecific as { bjjTrack?: string };
                return (
                  <div
                    key={line.id}
                    className="flex flex-col gap-2 rounded-2xl border border-charcoal/10 bg-cream/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-body font-medium text-charcoal">{line.student.fullName}</div>
                      <div className="text-xs text-charcoal/60">
                        {trackLabel(String(ps.bjjTrack ?? ""))} ·{" "}
                        {line.programDetails.paymentChoice === "plan" ? "Pay part today" : "Pay in full"}
                      </div>
                    </div>
                    <OutlineButton
                      type="button"
                      className="text-[10px] uppercase tracking-[0.18em]"
                      onClick={() => {
                        removeCartLine(line.id);
                        refreshCart();
                      }}
                    >
                      Remove
                    </OutlineButton>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <OutlineButton asChild className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/programs/bjj/register">Add another student</Link>
              </OutlineButton>
              <OutlineButton
                type="button"
                className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                onClick={() => {
                  clearFamilyCart();
                  refreshCart();
                }}
              >
                Clear cart
              </OutlineButton>
            </div>

            <ClayButton
              type="button"
              className="w-full px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
              onClick={() => setPhase("checkout")}
            >
              Continue to waivers
            </ClayButton>
          </PremiumCard>
        ) : null}

        {phase === "checkout" ? (
          <PremiumCard className="space-y-6 border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Promo code (optional)</div>
            <Input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="bg-white" />

            <div className="space-y-3">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Waivers (whole order)</div>
              {[
                ["liabilityWaiver", "I agree to the liability waiver."] as const,
                ["photoConsent", "I consent to photo/media use for program communications."] as const,
                ["medicalConsent", "I consent to medical treatment in case of emergency."] as const,
                ["termsAgreement", "I agree to the terms and policies."] as const,
              ].map(([key, label]) => (
                <label key={key} className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-cream p-4">
                  <Checkbox
                    checked={waivers[key]}
                    onCheckedChange={(v) => setWaivers((w) => ({ ...w, [key]: v === true }))}
                    aria-label={label}
                  />
                  <span className="font-body text-sm text-charcoal">{label}</span>
                </label>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="cart-sig" className="font-body text-sm text-charcoal">
                    Typed legal signature
                  </label>
                  <Input
                    id="cart-sig"
                    className="mt-1 bg-white"
                    value={waivers.signatureText}
                    onChange={(e) => setWaivers((w) => ({ ...w, signatureText: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="cart-signed" className="font-body text-sm text-charcoal">
                    Date signed
                  </label>
                  <Input
                    id="cart-signed"
                    type="date"
                    className="mt-1 bg-white"
                    value={waivers.signedAt}
                    onChange={(e) => setWaivers((w) => ({ ...w, signedAt: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <OutlineButton type="button" className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]" onClick={() => setPhase("review")}>
                Back
              </OutlineButton>
              <ClayButton
                type="button"
                disabled={loading}
                className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                onClick={() => void submitCheckout()}
              >
                {loading ? "Submitting…" : "Submit & pay"}
              </ClayButton>
            </div>
          </PremiumCard>
        ) : null}

        {phase === "pay" && clientSecret ? (
          <PremiumCard className="space-y-6 border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Pay today</div>
            {summary ? (
              <p className="font-body text-sm text-charcoal/80">
                <strong>{money(summary.dueTodayCents)}</strong> due now
                {summary.dueLaterCents > 0 ? (
                  <>
                    {" "}
                    · Remaining <strong>{money(summary.dueLaterCents)}</strong>
                    {summary.laterPaymentDate ? ` on or after ${summary.laterPaymentDate}` : " later this semester"} (charged
                    automatically if a card is on file).
                  </>
                ) : null}
              </p>
            ) : null}
            <PaymentProvider clientSecret={clientSecret}>
              <PaymentForm
                returnUrl={returnUrl}
                onSuccess={() => navigate(`/registration/success?rid=${firstRegistrationId ?? ""}&order=${enrollmentOrderId ?? ""}`)}
              />
            </PaymentProvider>
          </PremiumCard>
        ) : null}
      </main>
    </MotionPage>
  );
}
