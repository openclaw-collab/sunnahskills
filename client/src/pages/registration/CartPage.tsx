import React from "react";
import { Link, useLocation } from "wouter";
import { MotionPage } from "@/components/motion/PageMotion";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { loadFamilyCart, removeCartLine, clearFamilyCart, type FamilyCart } from "@/lib/familyCart";
import { useGuardianSession } from "@/hooks/useGuardianSession";
import { PaymentProvider } from "@/components/payment/PaymentProvider";
import { PaymentForm } from "@/components/payment/PaymentForm";
import { BJJ_TRACK_BY_KEY } from "../../../../shared/bjjCatalog";

type WaiverRecord = {
  id: number;
  title: string;
  body_html: string;
  version_label: string;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export default function CartPage() {
  const [, navigate] = useLocation();
  const [cart, setCart] = React.useState<FamilyCart | null>(() => loadFamilyCart());
  const sessionQuery = useGuardianSession();
  const [waiver, setWaiver] = React.useState<WaiverRecord | null>(null);
  const [phase, setPhase] = React.useState<"review" | "pay">("review");
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [orderId, setOrderId] = React.useState<number | null>(null);
  const [firstRegistrationId, setFirstRegistrationId] = React.useState<number | null>(null);
  const [summary, setSummary] = React.useState<{ dueTodayCents: number; dueLaterCents: number; laterPaymentDate: string | null } | null>(null);
  const [prorationCode, setProrationCode] = React.useState("");
  const [waivers, setWaivers] = React.useState({
    liabilityWaiver: false,
    photoConsent: false,
    medicalConsent: false,
    termsAgreement: false,
    signatureText: "",
    signedAt: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch("/api/waivers?slug=registration");
      const json = (await res.json().catch(() => null)) as { waiver?: WaiverRecord | null } | null;
      if (res.ok) setWaiver(json?.waiver ?? null);
    })();
  }, []);

  if (sessionQuery.isLoading) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-4xl px-6 pt-28">
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="text-sm text-charcoal/70">Loading your account...</div>
          </PremiumCard>
        </main>
      </MotionPage>
    );
  }

  if (!sessionQuery.data?.authenticated) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <SectionHeader eyebrow="Checkout" title="Sign in to finish checkout" className="mb-6" />
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <p className="text-sm leading-relaxed text-charcoal/70">
              Checkout is tied to your Family &amp; Member Account so participant records, waivers, and payment plans all
              stay in one place.
            </p>
            <div className="mt-6">
              <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register?next=%2Fregistration%2Fcart">Open your account</Link>
              </ClayButton>
            </div>
          </PremiumCard>
        </main>
      </MotionPage>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <SectionHeader eyebrow="Checkout" title="Your cart is empty" className="mb-6" />
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <p className="text-sm leading-relaxed text-charcoal/70">
              Add one or more BJJ registrations first, then come back here to review the order, confirm the waiver,
              and pay.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/programs/bjj/register">Back to BJJ</Link>
              </ClayButton>
              <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/trial">Start with a free trial</Link>
              </OutlineButton>
            </div>
          </PremiumCard>
        </main>
      </MotionPage>
    );
  }

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/registration/success?rid=${firstRegistrationId ?? ""}&order=${orderId ?? ""}`
      : "/registration/success";

  async function submitCheckout() {
    if (!cart) return;
    const currentCart = cart;
    if (!waiver?.id) {
      setError("The live waiver could not be loaded.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const regRes = await fetch("/api/register/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: {
            ...currentCart.account,
            email: sessionQuery.data?.email ?? currentCart.account.email,
          },
          lines: currentCart.lines,
          prorationCode: prorationCode.trim() || undefined,
          waivers: {
            waiverId: waiver.id,
            ...waivers,
          },
        }),
      });
      const regJson = (await regRes.json().catch(() => null)) as any;
      if (!regRes.ok) throw new Error(regJson?.error ?? "Could not submit the registrations.");
      if (regJson?.summary?.waitlisted) {
        clearFamilyCart();
        navigate("/registration/waitlist");
        return;
      }

      const nextOrderId = Number(regJson?.enrollmentOrderId ?? 0);
      const registrationIds = Array.isArray(regJson?.registrationIds) ? (regJson.registrationIds as number[]) : [];
      setOrderId(nextOrderId);
      setFirstRegistrationId(registrationIds[0] ?? null);

      const payRes = await fetch("/api/payments/create-order-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentOrderId: nextOrderId }),
      });
      const payJson = (await payRes.json().catch(() => null)) as any;
      if (!payRes.ok || !payJson?.clientSecret) {
        throw new Error(payJson?.error ?? "Could not start payment.");
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not finish checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-5xl px-6 pt-28">
        <SectionHeader eyebrow="Checkout" title="Review the order and confirm the waiver" className="mb-6" />

        {phase === "review" ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Registration lines</div>
              <div className="space-y-3">
                {cart.lines.map((line) => (
                  <div key={line.id} className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-charcoal">{line.participant.fullName}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                          {Object.prototype.hasOwnProperty.call(BJJ_TRACK_BY_KEY, line.programDetails.programSpecific.bjjTrack)
                            ? BJJ_TRACK_BY_KEY[line.programDetails.programSpecific.bjjTrack as keyof typeof BJJ_TRACK_BY_KEY].registerLabel
                            : line.programDetails.programSpecific.bjjTrack}
                        </div>
                        <div className="mt-2 text-sm text-charcoal/65">
                          {line.paymentChoice === "plan" ? "Pay half now, half on May 12, 2026" : "Pay in full"}
                        </div>
                      </div>
                      <OutlineButton
                        className="px-3 py-2 text-[10px] uppercase tracking-[0.18em]"
                        onClick={() => {
                          removeCartLine(line.id);
                          setCart(loadFamilyCart());
                        }}
                      >
                        Remove
                      </OutlineButton>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="text-sm text-charcoal">
                  One-time proration code (optional)
                  <Input
                    className="mt-2 bg-cream/50 border-charcoal/10"
                    value={prorationCode}
                    onChange={(event) => setProrationCode(event.target.value.toUpperCase())}
                    placeholder="Only enter a staff-issued code"
                  />
                </label>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                  Without a valid staff code, pricing stays at the standard full-term amount.
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Waiver and payment consent</div>
              {waiver ? (
                <>
                  <div className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
                    <div className="text-sm font-medium text-charcoal">{waiver.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">Version {waiver.version_label}</div>
                    <div
                      className="prose prose-sm mt-4 max-w-none text-charcoal"
                      dangerouslySetInnerHTML={{ __html: waiver.body_html }}
                    />
                  </div>

                  <div className="mt-5 space-y-4">
                    <label className="flex items-start gap-3 text-sm text-charcoal">
                      <Checkbox checked={waivers.liabilityWaiver} onCheckedChange={(checked) => setWaivers((prev) => ({ ...prev, liabilityWaiver: checked === true }))} />
                      <span>I accept the liability waiver.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-charcoal">
                      <Checkbox checked={waivers.medicalConsent} onCheckedChange={(checked) => setWaivers((prev) => ({ ...prev, medicalConsent: checked === true }))} />
                      <span>I confirm the emergency-contact information and authorize emergency care if needed.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-charcoal">
                      <Checkbox checked={waivers.termsAgreement} onCheckedChange={(checked) => setWaivers((prev) => ({ ...prev, termsAgreement: checked === true }))} />
                      <span>I accept the payment and registration policies for this order.</span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-charcoal">
                      <Checkbox checked={waivers.photoConsent} onCheckedChange={(checked) => setWaivers((prev) => ({ ...prev, photoConsent: checked === true }))} />
                      <span>I consent to photo usage for community updates.</span>
                    </label>

                    <label className="text-sm text-charcoal">
                      Signature
                      <Input className="mt-2 bg-cream/50 border-charcoal/10" value={waivers.signatureText} onChange={(event) => setWaivers((prev) => ({ ...prev, signatureText: event.target.value }))} />
                    </label>
                    <label className="text-sm text-charcoal">
                      Signed on
                      <Input className="mt-2 bg-cream/50 border-charcoal/10" type="date" value={waivers.signedAt} onChange={(event) => setWaivers((prev) => ({ ...prev, signedAt: event.target.value }))} />
                    </label>
                  </div>
                </>
              ) : (
                <div className="text-sm text-charcoal/70">Loading the active waiver...</div>
              )}

              {error ? <div className="mt-4 text-sm text-clay">{error}</div> : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <ClayButton
                  className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                  disabled={submitting}
                  onClick={submitCheckout}
                >
                  {submitting ? "Preparing payment..." : "Continue to payment"}
                </ClayButton>
                <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/programs/bjj/register">Back to cart builder</Link>
                </OutlineButton>
              </div>
            </PremiumCard>
          </div>
        ) : clientSecret ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Payment</div>
              <PaymentProvider clientSecret={clientSecret}>
                <PaymentForm returnUrl={returnUrl} onSuccess={() => navigate(returnUrl)} />
              </PaymentProvider>
            </PremiumCard>

            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Order summary</div>
              <div className="space-y-3 text-sm text-charcoal/75">
                <div>Due today: <strong className="text-charcoal">{money(summary?.dueTodayCents ?? 0)}</strong></div>
                <div>
                  Later balance: <strong className="text-charcoal">{money(summary?.dueLaterCents ?? 0)}</strong>
                </div>
                <div>
                  Later charge date: <strong className="text-charcoal">{summary?.laterPaymentDate ?? "None"}</strong>
                </div>
                {summary && summary.dueLaterCents > 0 ? (
                  <div className="rounded-2xl border border-clay/15 bg-clay/5 p-4 text-sm text-charcoal/75">
                    Your card will be saved for the automatic second half on {summary.laterPaymentDate ?? "the scheduled date"}.
                  </div>
                ) : null}
              </div>
            </PremiumCard>
          </div>
        ) : null}
      </main>
    </MotionPage>
  );
}
