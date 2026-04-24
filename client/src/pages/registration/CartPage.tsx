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
import {
  buildFamilyCartFingerprint,
  clearFamilyCart,
  clearPendingFamilyCheckout,
  loadFamilyCart,
  loadPendingFamilyCheckout,
  removeCartLine,
  savePendingFamilyCheckout,
  updateCartLine,
  type FamilyCart,
} from "@/lib/familyCart";
import { useGuardianSession } from "@/hooks/useGuardianSession";
import { PaymentProvider } from "@/components/payment/PaymentProvider";
import { PaymentForm } from "@/components/payment/PaymentForm";
import { BJJ_TRACK_BY_KEY, isBjjTrackKey } from "../../../../shared/bjjCatalog";
import { formatMoneyFromCents } from "@shared/money";
import {
  ARCHERY_ADDITIONAL_REGISTRATION_PRICE_CENTS,
  ARCHERY_FIRST_REGISTRATION_PRICE_CENTS,
  ARCHERY_SERIES_LABEL,
  getArcheryFamilyPriceCents,
} from "../../../../shared/archeryCatalog";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

type WaiverRecord = {
  id: number;
  title: string;
  body_html: string;
  version_label: string;
};

function money(cents: number) {
  return formatMoneyFromCents(cents);
}

function lineProgramSlug(line: FamilyCart["lines"][number]) {
  return line.programSlug ?? "bjj";
}

function lineProgramLabel(line: FamilyCart["lines"][number]) {
  if (lineProgramSlug(line) === "archery") return "Traditional Archery";
  return "Brazilian Jiu-Jitsu";
}

function lineDetailLabel(line: FamilyCart["lines"][number]) {
  if (line.programSlug === "archery") return ARCHERY_SERIES_LABEL;
  const track = line.programDetails.programSpecific.bjjTrack;
  return Object.prototype.hasOwnProperty.call(BJJ_TRACK_BY_KEY, track)
    ? BJJ_TRACK_BY_KEY[track as keyof typeof BJJ_TRACK_BY_KEY].registerLabel
    : track;
}

function archeryLinePriceCents(lines: FamilyCart["lines"], lineId: string) {
  const archeryLines = lines.filter((line) => line.programSlug === "archery");
  const archeryIndex = archeryLines.findIndex((line) => line.id === lineId);
  return getArcheryFamilyPriceCents(archeryIndex);
}

function discountReasonCopy(reason: string | undefined) {
  switch (reason) {
    case "not_found":
      return "That code doesn't exist. Double-check and try again.";
    case "program_mismatch":
      return "That code doesn't apply to this registration.";
    case "max_uses_reached":
      return "That code has already been fully used.";
    case "not_started":
      return "That code isn't active yet.";
    case "expired":
      return "That code has expired.";
    case "unsupported_type":
      return "Sibling pricing is applied automatically. That code doesn't need to be entered here.";
    default:
      return "That discount code couldn't be applied.";
  }
}

function getInitialCheckoutState() {
  const cart = loadFamilyCart();
  const pending = loadPendingFamilyCheckout();
  if (!cart || !pending) {
    return {
      cart,
      orderId: null,
      firstRegistrationId: null,
      prorationCode: "",
    };
  }

  const expectedFingerprint = buildFamilyCartFingerprint(cart, pending.prorationCode);
  if (pending.cartFingerprint !== expectedFingerprint) {
    clearPendingFamilyCheckout();
    return {
      cart,
      orderId: null,
      firstRegistrationId: null,
      prorationCode: "",
    };
  }

  return {
    cart,
    orderId: pending.orderId,
    firstRegistrationId: pending.firstRegistrationId,
    prorationCode: pending.prorationCode,
  };
}

export default function CartPage() {
  const [, navigate] = useLocation();
  const initialCheckoutState = React.useMemo(() => getInitialCheckoutState(), []);
  const [cart, setCart] = React.useState<FamilyCart | null>(initialCheckoutState.cart);
  const sessionQuery = useGuardianSession();
  const [waiver, setWaiver] = React.useState<WaiverRecord | null>(null);
  const [phase, setPhase] = React.useState<"review" | "pay">("review");
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [orderId, setOrderId] = React.useState<number | null>(initialCheckoutState.orderId);
  const [firstRegistrationId, setFirstRegistrationId] = React.useState<number | null>(initialCheckoutState.firstRegistrationId);
  const [summary, setSummary] = React.useState<{
    dueTodayCents: number;
    dueLaterCents: number;
    laterPaymentDate: string | null;
    siblingDiscountCents: number;
    trialCreditCents: number;
    promoDiscountCents: number;
  } | null>(null);
  const [reconcileToken, setReconcileToken] = React.useState<string | null>(null);
  const [laterChargeAuthorized, setLaterChargeAuthorized] = React.useState(false);
  const [prorationCode, setProrationCode] = React.useState(initialCheckoutState.prorationCode);
  const [checkoutDiscountCode, setCheckoutDiscountCode] = React.useState("");
  const [checkoutDiscountFeedback, setCheckoutDiscountFeedback] = React.useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [lineDiscountDrafts, setLineDiscountDrafts] = React.useState<Record<string, string>>({});
  const [lineDiscountOpen, setLineDiscountOpen] = React.useState<Record<string, boolean>>({});
  const [lineDiscountFeedback, setLineDiscountFeedback] = React.useState<
    Record<string, { tone: "success" | "error"; message: string }>
  >({});
  const [waivers, setWaivers] = React.useState({
    liabilityWaiver: false,
    photoConsent: false,
    medicalConsent: false,
    termsAgreement: false,
    signatureText: "",
    signedAt: new Date().toISOString().slice(0, 10),
  });
  const [waiverErrors, setWaiverErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cartLines = cart?.lines ?? [];
  const hasBjjLine = cartLines.some((line) => lineProgramSlug(line) === "bjj");
  const includesWomenBjjTrack = React.useMemo(
    () => cartLines.some((line) => {
      if (line.programSlug === "archery") return false;
      const track = String(line.programDetails.programSpecific.bjjTrack ?? "");
      return isBjjTrackKey(track) && BJJ_TRACK_BY_KEY[track].marketingGroup === "women";
    }),
    [cartLines],
  );
  const mediaDisclaimer = includesWomenBjjTrack
    ? "Women’s sessions are run as a camera-free environment. We still cannot control photos or videos taken by other families or guests outside that setting."
    : "We try to respect family preferences, but cannot control photos or videos taken by other families or guests.";
  const checkoutFingerprint = React.useMemo(
    () => (cart ? buildFamilyCartFingerprint(cart, prorationCode) : null),
    [cart, prorationCode],
  );

  function resetPendingCheckout(options?: { preserveError?: boolean }) {
    clearPendingFamilyCheckout();
    setOrderId(null);
    setFirstRegistrationId(null);
    setClientSecret(null);
    setSummary(null);
    setReconcileToken(null);
    setPhase("review");
    if (!options?.preserveError) setError(null);
  }

  React.useEffect(() => {
    const nextDrafts = Object.fromEntries(cartLines.map((line) => [line.id, line.discountCode ?? ""]));
    const nextOpen = Object.fromEntries(cartLines.map((line) => [line.id, Boolean(line.discountCode)]));
    const activeLineIds = new Set(cartLines.map((line) => line.id));
    setLineDiscountDrafts(nextDrafts);
    setLineDiscountOpen((prev) => {
      const merged = { ...nextOpen };
      for (const line of cartLines) {
        if (prev[line.id]) merged[line.id] = true;
      }
      return merged;
    });
    setLineDiscountFeedback((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([lineId]) => activeLineIds.has(lineId))),
    );
  }, [cartLines]);

  React.useEffect(() => {
    if (!summary || summary.dueLaterCents <= 0) {
      setLaterChargeAuthorized(false);
    }
  }, [summary]);

  React.useEffect(() => {
    const pending = loadPendingFamilyCheckout();
    if (!pending) return;

    if (!cart || !checkoutFingerprint || pending.cartFingerprint !== checkoutFingerprint) {
      resetPendingCheckout();
    }
  }, [cart, checkoutFingerprint]);

  React.useEffect(() => {
    (async () => {
      const waiverSlug = cartLines.some((line) => lineProgramSlug(line) === "archery") ? "archery" : "registration";
      const res = await fetch(`/api/waivers?slug=${encodeURIComponent(waiverSlug)}`);
      const json = (await res.json().catch(() => null)) as { waiver?: WaiverRecord | null } | null;
      if (res.ok) setWaiver(json?.waiver ?? null);
    })();
  }, [cartLines]);

  if (sessionQuery.isLoading) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-4xl px-6 pt-28">
          <StudioBlock id="registration.cart.loading" label="Cart loading state">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <StudioText
                k="registration.cart.loadingCopy"
                defaultText="Loading your account..."
                as="p"
                className="text-sm text-charcoal/70"
              />
            </PremiumCard>
          </StudioBlock>
        </main>
      </MotionPage>
    );
  }

  if (!sessionQuery.data?.authenticated) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <StudioBlock id="registration.cart.signin" label="Cart sign-in gate">
            <SectionHeader
              eyebrow={<StudioText k="registration.cart.signinEyebrow" defaultText="Checkout" />}
              title={<StudioText k="registration.cart.signinTitle" defaultText="Sign in to finish checkout" />}
              className="mb-6"
            />
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <StudioText
                k="registration.cart.signinCopy"
                defaultText="Sign in so your registrations, waivers, and payments stay in one place."
                as="p"
                className="text-sm leading-relaxed text-charcoal/70"
              />
              <div className="mt-6">
                <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/register?next=%2Fregistration%2Fcart">Sign in to checkout</Link>
                </ClayButton>
              </div>
            </PremiumCard>
          </StudioBlock>
        </main>
      </MotionPage>
    );
  }

  if (phase === "review" && (!cart || cart.lines.length === 0)) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <StudioBlock id="registration.cart.empty" label="Empty cart state">
            <SectionHeader
              eyebrow={<StudioText k="registration.cart.emptyEyebrow" defaultText="Checkout" />}
              title={<StudioText k="registration.cart.emptyTitle" defaultText="Your cart is empty" />}
              className="mb-6"
            />
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <StudioText
                k="registration.cart.emptyCopy"
                defaultText="Add a BJJ or Archery registration first, then come back here to review waivers and payment."
                as="p"
                className="text-sm leading-relaxed text-charcoal/70"
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/register">Choose a program</Link>
                </ClayButton>
                <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/trial">Start with a free trial</Link>
                </OutlineButton>
              </div>
            </PremiumCard>
          </StudioBlock>
        </main>
      </MotionPage>
    );
  }

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/registration/success?rid=${firstRegistrationId ?? ""}&order=${orderId ?? ""}${reconcileToken ? `&reconcile_token=${encodeURIComponent(reconcileToken)}` : ""}`
      : "/registration/success";

  function clearWaiverError(field: string) {
    setWaiverErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateWaiverInputs() {
    const issues: Record<string, string> = {};
    if (!waivers.liabilityWaiver) issues.liabilityWaiver = "Liability waiver is required.";
    if (!waivers.medicalConsent) issues.medicalConsent = "Medical consent is required.";
    if (!waivers.termsAgreement) issues.termsAgreement = "Terms acceptance is required.";
    if (!waivers.signatureText.trim()) issues.signatureText = "Signature is required.";
    const signedAt = Date.parse(waivers.signedAt);
    if (!Number.isFinite(signedAt) || signedAt > Date.now()) {
      issues.signedAt = "Signed date must be today or in the past.";
    }
    setWaiverErrors(issues);
    return Object.keys(issues).length === 0;
  }

  async function submitCheckout() {
    const hasExistingOrder = Boolean(orderId);
    if (!hasExistingOrder) {
      if (!waiver?.id) {
        setError("Couldn't load the waiver. Refresh the page or try again.");
        return;
      }
      if (!validateWaiverInputs()) {
        setError("Fill out all required waiver fields to continue.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      let nextOrderId = orderId;

      if (!nextOrderId) {
        if (!cart) throw new Error("Your cart is empty.");
        if (!waiver?.id) throw new Error("The live waiver could not be loaded.");
        const currentCart = cart;
        const normalizedProrationCode = prorationCode.trim().toUpperCase();
        const regRes = await fetch("/api/register/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: {
              ...currentCart.account,
              email: sessionQuery.data?.email ?? currentCart.account.email,
            },
            lines: currentCart.lines,
            prorationCode: normalizedProrationCode || undefined,
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

        nextOrderId = Number(regJson?.enrollmentOrderId ?? 0);
        const registrationIds = Array.isArray(regJson?.registrationIds) ? (regJson.registrationIds as number[]) : [];
        setOrderId(nextOrderId);
        setFirstRegistrationId(registrationIds[0] ?? null);
        savePendingFamilyCheckout({
          orderId: nextOrderId,
          firstRegistrationId: registrationIds[0] ?? null,
          prorationCode: normalizedProrationCode,
          cartFingerprint: buildFamilyCartFingerprint(currentCart, normalizedProrationCode),
        });
      }
      if (!nextOrderId || !Number.isInteger(nextOrderId) || nextOrderId <= 0) {
        throw new Error("Could not start checkout for this order.");
      }

      const payRes = await fetch("/api/payments/create-order-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentOrderId: nextOrderId }),
      });
      const payJson = (await payRes.json().catch(() => null)) as any;
      if (!payRes.ok || !payJson?.clientSecret) {
        if (hasExistingOrder) {
          resetPendingCheckout({ preserveError: true });
          throw new Error(payJson?.error ?? "Your checkout session expired. Click Continue to refresh.");
        }
        throw new Error(payJson?.error ?? "Could not start payment.");
      }

      setClientSecret(payJson.clientSecret as string);
      setReconcileToken(typeof payJson.reconcileToken === "string" ? payJson.reconcileToken : null);
      setSummary({
        dueTodayCents: Number(payJson.dueTodayCents ?? 0),
        dueLaterCents: Number(payJson.dueLaterCents ?? 0),
        laterPaymentDate: payJson.laterPaymentDate ?? null,
        siblingDiscountCents: Number(payJson.siblingDiscountCents ?? 0),
        trialCreditCents: Number(payJson.trialCreditCents ?? 0),
        promoDiscountCents: Number(payJson.promoDiscountCents ?? 0),
      });
      setPhase("pay");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout didn't complete. Your cart is saved—try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function applyLineDiscount(lineId: string) {
    const code = lineDiscountDrafts[lineId]?.trim().toUpperCase() ?? "";
    if (!code) {
      setLineDiscountFeedback((prev) => ({
        ...prev,
        [lineId]: { tone: "error", message: "Type a code first, then click Apply." },
      }));
      return;
    }

    const line = cartLines.find((entry) => entry.id === lineId);
    const res = await fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, programId: line ? lineProgramSlug(line) : "bjj" }),
    });
    const json = (await res.json().catch(() => null)) as
      | { valid?: boolean; reason?: string; type?: string }
      | null;

    if (!res.ok || !json?.valid) {
      setLineDiscountFeedback((prev) => ({
        ...prev,
        [lineId]: { tone: "error", message: discountReasonCopy(json?.reason) },
      }));
      return;
    }

    const nextCart = updateCartLine(lineId, (line) => ({ ...line, discountCode: code }));
    setCart(nextCart);
    setLineDiscountFeedback((prev) => ({
      ...prev,
      [lineId]: { tone: "success", message: "Discount code saved for this registration." },
    }));
  }

  async function applyCheckoutDiscount() {
    const code = checkoutDiscountCode.trim().toUpperCase();
    if (!code) {
      setCheckoutDiscountFeedback({ tone: "error", message: "Type a code first, then click Apply." });
      return;
    }
    if (cartLines.length === 0) {
      setCheckoutDiscountFeedback({ tone: "error", message: "Add a registration before applying a code." });
      return;
    }

    let applied = 0;
    const skipped: string[] = [];
    for (const line of cartLines) {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, programId: lineProgramSlug(line) }),
      });
      const json = (await res.json().catch(() => null)) as
        | { valid?: boolean; reason?: string }
        | null;

      if (!res.ok || !json?.valid) {
        skipped.push(line.participant.fullName);
        continue;
      }

      updateCartLine(line.id, (current) => ({ ...current, discountCode: code }));
      applied += 1;
    }

    const nextCart = loadFamilyCart();
    setCart(nextCart);
    setLineDiscountDrafts((prev) => ({
      ...prev,
      ...Object.fromEntries((nextCart?.lines ?? []).map((line) => [line.id, line.discountCode ?? ""])),
    }));
    setLineDiscountOpen((prev) => ({
      ...prev,
      ...Object.fromEntries((nextCart?.lines ?? []).filter((line) => line.discountCode).map((line) => [line.id, true])),
    }));

    if (applied === 0) {
      setCheckoutDiscountFeedback({ tone: "error", message: "That code did not apply to any registration in this checkout." });
      return;
    }
    setCheckoutDiscountFeedback({
      tone: skipped.length > 0 ? "error" : "success",
      message:
        skipped.length > 0
          ? `Code applied to ${applied} registration${applied === 1 ? "" : "s"}. It did not apply to ${skipped.join(", ")}.`
          : `Code applied to ${applied} registration${applied === 1 ? "" : "s"}.`,
    });
  }

  function clearLineDiscount(lineId: string) {
    const nextCart = updateCartLine(lineId, (line) => {
      const nextLine = { ...line };
      delete nextLine.discountCode;
      return nextLine;
    });
    setCart(nextCart);
    setLineDiscountDrafts((prev) => ({ ...prev, [lineId]: "" }));
    setLineDiscountOpen((prev) => ({ ...prev, [lineId]: false }));
    setLineDiscountFeedback((prev) => ({
      ...prev,
      [lineId]: { tone: "success", message: "Discount code removed." },
    }));
  }

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-5xl px-6 pt-28" data-testid="registration-cart-page">
        <StudioBlock id="registration.cart.page" label="Cart page">
          <SectionHeader
            eyebrow={<StudioText k="registration.cart.eyebrow" defaultText="Checkout" />}
            title={<StudioText k="registration.cart.title" defaultText="Review the order and confirm the waiver" />}
            className="mb-6"
          />
        </StudioBlock>

        {phase === "review" ? (
          <StudioBlock id="registration.cart.review" label="Cart review">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <PremiumCard className="border border-charcoal/10 bg-white p-6" data-testid="registration-cart-line-items">
                <StudioText
                k="registration.cart.linesHeading"
                  defaultText="Registrations in this checkout"
                  as="div"
                  className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3"
                />
              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div key={line.id} className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-charcoal">{line.participant.fullName}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                          {lineProgramLabel(line)} · {lineDetailLabel(line)}
                        </div>
                        {line.programSlug === "archery" ? (
                          <div className="mt-2 text-sm text-charcoal/65">
                            Eye dominance: {line.programDetails.programSpecific.eyeDominance || "not set"} · Price: {money(archeryLinePriceCents(cartLines, line.id))}
                          </div>
                        ) : null}
                        <StudioText
                          k={
                            line.paymentChoice === "plan"
                              ? "registration.cart.linePaymentPlan"
                              : "registration.cart.linePaymentFull"
                          }
                          defaultText={
                            lineProgramSlug(line) === "archery"
                              ? "Pay in full"
                              : line.paymentChoice === "plan"
                              ? "Pay half now, half on May 12, 2026"
                              : "Pay in full"
                          }
                          as="div"
                          className="mt-2 text-sm text-charcoal/65"
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <OutlineButton
                            className="px-3 py-2 text-[10px] uppercase tracking-[0.18em]"
                            onClick={() =>
                              setLineDiscountOpen((prev) => ({ ...prev, [line.id]: !prev[line.id] }))
                            }
                          >
                            {line.discountCode ? "Edit discount" : "Add discount"}
                          </OutlineButton>
                          {line.discountCode ? (
                            <div className="text-xs uppercase tracking-[0.16em] text-moss">
                              Code saved: {line.discountCode}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <OutlineButton
                        className="px-3 py-2 text-[10px] uppercase tracking-[0.18em]"
                        onClick={() => {
                          removeCartLine(line.id);
                          setCart(loadFamilyCart());
                        }}
                      >
                        <StudioText
                          k="registration.cart.removeLine"
                          defaultText="Remove"
                          as="span"
                        />
                      </OutlineButton>
                    </div>
                    {lineDiscountOpen[line.id] ? (
                      <div className="mt-4 rounded-2xl border border-charcoal/10 bg-white px-4 py-4">
                        <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/50">
                          Discount code
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <Input
                            className="bg-cream/50 border-charcoal/10"
                            value={lineDiscountDrafts[line.id] ?? ""}
                            onChange={(event) =>
                              setLineDiscountDrafts((prev) => ({
                                ...prev,
                                [line.id]: event.target.value.toUpperCase(),
                              }))
                            }
                            placeholder="Enter code for this registration"
                          />
                          <ClayButton
                            className="px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
                            onClick={() => applyLineDiscount(line.id)}
                          >
                            Apply code
                          </ClayButton>
                          {line.discountCode ? (
                            <OutlineButton
                              className="px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
                              onClick={() => clearLineDiscount(line.id)}
                            >
                              Remove code
                            </OutlineButton>
                          ) : null}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                          Applies only to this registration line.
                        </div>
                        {lineDiscountFeedback[line.id] ? (
                          <div
                            className={`mt-3 text-sm ${
                              lineDiscountFeedback[line.id]?.tone === "error" ? "text-clay" : "text-moss"
                            }`}
                          >
                            {lineDiscountFeedback[line.id]?.message}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="text-sm text-charcoal">
                  <StudioText
                    k="registration.cart.discountLabel"
                    defaultText="Discount code for this checkout (optional)"
                    as="span"
                  />
                  <Input
                    className="mt-2 bg-cream/50 border-charcoal/10"
                    value={checkoutDiscountCode}
                    onChange={(event) => {
                      setCheckoutDiscountCode(event.target.value.toUpperCase());
                      setCheckoutDiscountFeedback(null);
                    }}
                    placeholder="Enter discount code"
                  />
                </label>
                <div className="mt-3">
                  <OutlineButton
                    className="px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
                    onClick={applyCheckoutDiscount}
                  >
                    Apply to all eligible registrations
                  </OutlineButton>
                </div>
                <StudioText
                  k="registration.cart.discountHelper"
                  defaultText={`Archery pricing: first family registration ${money(ARCHERY_FIRST_REGISTRATION_PRICE_CENTS)}, additional family registrations ${money(ARCHERY_ADDITIONAL_REGISTRATION_PRICE_CENTS)}. You can also apply a different code on an individual registration above.`}
                  as="div"
                  className="mt-2 text-xs uppercase tracking-[0.16em] text-charcoal/55"
                />
                {checkoutDiscountFeedback ? (
                  <div className={`mt-3 text-sm ${checkoutDiscountFeedback.tone === "error" ? "text-clay" : "text-moss"}`}>
                    {checkoutDiscountFeedback.message}
                  </div>
                ) : null}
              </div>
              </PremiumCard>

              <PremiumCard className="border border-charcoal/10 bg-white p-6" data-testid="registration-cart-summary">
                <StudioText
                  k="registration.cart.waiverHeading"
                  defaultText="Waiver and payment consent"
                  as="div"
                  className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3"
                />
              {waiver ? (
                <>
                  <div className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
                    <StudioText
                      k="registration.cart.waiverTitle"
                      defaultText={waiver.title}
                      as="div"
                      className="text-sm font-medium text-charcoal"
                    />
                    <StudioText
                      k="registration.cart.waiverVersion"
                      defaultText={`Version ${waiver.version_label}`}
                      as="div"
                      className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55"
                    />
                    <div
                      className="prose prose-sm mt-4 max-w-none text-charcoal"
                      dangerouslySetInnerHTML={{ __html: waiver.body_html }}
                    />
                  </div>

                  <div className="mt-5 space-y-4">
                    <label className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm text-charcoal ${waiverErrors.liabilityWaiver ? "border-clay bg-clay/5" : "border-charcoal/10 bg-cream/35"}`}>
                      <Checkbox
                        checked={waivers.liabilityWaiver}
                        onCheckedChange={(checked) => {
                          setWaivers((prev) => ({ ...prev, liabilityWaiver: checked === true }));
                          clearWaiverError("liabilityWaiver");
                        }}
                      />
                      <StudioText
                        k="registration.cart.liabilityText"
                        defaultText="I accept the liability waiver."
                        as="span"
                      />
                    </label>
                    <label className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm text-charcoal ${waiverErrors.medicalConsent ? "border-clay bg-clay/5" : "border-charcoal/10 bg-cream/35"}`}>
                      <Checkbox
                        checked={waivers.medicalConsent}
                        onCheckedChange={(checked) => {
                          setWaivers((prev) => ({ ...prev, medicalConsent: checked === true }));
                          clearWaiverError("medicalConsent");
                        }}
                      />
                      <StudioText
                        k="registration.cart.medicalText"
                        defaultText="I confirm the emergency-contact information and authorize emergency care if needed."
                        as="span"
                      />
                    </label>
                    <label className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm text-charcoal ${waiverErrors.termsAgreement ? "border-clay bg-clay/5" : "border-charcoal/10 bg-cream/35"}`}>
                      <Checkbox
                        checked={waivers.termsAgreement}
                        onCheckedChange={(checked) => {
                          setWaivers((prev) => ({ ...prev, termsAgreement: checked === true }));
                          clearWaiverError("termsAgreement");
                        }}
                      />
                      <StudioText
                        k="registration.cart.termsText"
                        defaultText="I accept the payment and registration policies for this order."
                        as="span"
                      />
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-charcoal/10 bg-cream/35 px-3 py-3 text-sm text-charcoal">
                      <Checkbox
                        checked={waivers.photoConsent}
                        onCheckedChange={(checked) => {
                          setWaivers((prev) => ({ ...prev, photoConsent: checked === true }));
                          clearWaiverError("photoConsent");
                        }}
                      />
                      <div className="space-y-1">
                        <StudioText
                          k="registration.cart.mediaText"
                          defaultText="Optional: I consent to photo/media use for community updates."
                          as="span"
                          className="block"
                        />
                        <StudioText
                          k="registration.cart.mediaDisclaimer"
                          defaultText={mediaDisclaimer}
                          as="span"
                          className="block text-xs text-charcoal/60"
                        />
                      </div>
                    </label>

                    <label className="text-sm text-charcoal">
                      <StudioText k="registration.cart.signatureLabel" defaultText="Signature" as="span" />
                      <Input
                        className={`mt-2 bg-cream/50 ${waiverErrors.signatureText ? "border-clay focus-visible:ring-clay/30" : "border-charcoal/10"}`}
                        value={waivers.signatureText}
                        onChange={(event) => {
                          setWaivers((prev) => ({ ...prev, signatureText: event.target.value }));
                          clearWaiverError("signatureText");
                        }}
                      />
                    </label>
                    <label className="text-sm text-charcoal">
                      <StudioText k="registration.cart.signedOnLabel" defaultText="Signed on" as="span" />
                      <Input
                        className={`mt-2 bg-cream/50 ${waiverErrors.signedAt ? "border-clay focus-visible:ring-clay/30" : "border-charcoal/10"}`}
                        type="date"
                        value={waivers.signedAt}
                        onChange={(event) => {
                          setWaivers((prev) => ({ ...prev, signedAt: event.target.value }));
                          clearWaiverError("signedAt");
                        }}
                      />
                    </label>
                    {Object.keys(waiverErrors).length > 0 ? (
                      <StudioText
                        k="registration.cart.waiverError"
                        defaultText="Complete every required waiver, signature, and date before continuing."
                        as="div"
                        className="rounded-xl border border-clay/25 bg-clay/10 px-3 py-3 text-sm text-clay"
                      />
                    ) : null}
                  </div>
                </>
              ) : (
                <StudioText
                  k="registration.cart.waiverLoading"
                  defaultText="Loading the active waiver..."
                  as="div"
                  className="text-sm text-charcoal/70"
                />
              )}

              {error ? <div className="mt-4 text-sm text-clay">{error}</div> : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <ClayButton
                  className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                  disabled={submitting}
                  onClick={submitCheckout}
                >
                  <StudioText
                    k={submitting ? "registration.cart.preparingPayment" : orderId ? "registration.cart.retryPayment" : "registration.cart.continuePayment"}
                    defaultText={submitting ? "Preparing payment..." : orderId ? "Try payment again" : "Continue to payment"}
                    as="span"
                  />
                </ClayButton>
                <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/register">
                    <StudioText k="registration.cart.backToBuilder" defaultText="Add another registration" />
                  </Link>
                </OutlineButton>
              </div>
              </PremiumCard>
            </div>
          </StudioBlock>
        ) : clientSecret ? (
          <StudioBlock id="registration.cart.payment" label="Cart payment">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <PremiumCard className="border border-charcoal/10 bg-white p-6" data-testid="registration-payment-form">
                <StudioText
                  k="registration.cart.paymentHeading"
                  defaultText="Payment"
                  as="div"
                  className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3"
                />
                <PaymentProvider clientSecret={clientSecret}>
                <PaymentForm
                  returnUrl={returnUrl}
                  submitDisabled={(summary?.dueLaterCents ?? 0) > 0 && !laterChargeAuthorized}
                  onSuccess={({ paymentIntentId } = {}) => {
                    clearPendingFamilyCheckout();
                    clearFamilyCart();
                    setCart(null);
                    const successUrl = paymentIntentId
                      ? `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}payment_intent=${encodeURIComponent(paymentIntentId)}`
                      : returnUrl;
                    navigate(successUrl);
                  }}
                />
              </PaymentProvider>
              </PremiumCard>

              <PremiumCard className="border border-charcoal/10 bg-white p-6" data-testid="registration-order-summary">
                <StudioText
                  k="registration.cart.summaryHeading"
                  defaultText="Order summary"
                  as="div"
                  className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3"
                />
              <div className="space-y-3 text-sm text-charcoal/75">
                {summary && summary.siblingDiscountCents > 0 ? (
                  <div>
                    <StudioText k="registration.cart.summarySibling" defaultText="Sibling discount:" as="span" />{" "}
                    <strong className="text-charcoal">−{money(summary.siblingDiscountCents)}</strong>
                  </div>
                ) : null}
                {summary && summary.trialCreditCents > 0 ? (
                  <div>
                    <StudioText k="registration.cart.summaryTrial" defaultText="Trial class credit:" as="span" />{" "}
                    <strong className="text-charcoal">−{money(summary.trialCreditCents)}</strong>
                  </div>
                ) : null}
                {summary && summary.promoDiscountCents > 0 ? (
                  <div>
                    <StudioText k="registration.cart.summaryPromo" defaultText="Discount codes:" as="span" />{" "}
                    <strong className="text-charcoal">−{money(summary.promoDiscountCents)}</strong>
                  </div>
                ) : null}
                <div>
                  <StudioText k="registration.cart.summaryDueToday" defaultText="Due today:" as="span" />{" "}
                  <strong className="text-charcoal">{money(summary?.dueTodayCents ?? 0)}</strong>
                </div>
                <div>
                  <StudioText k="registration.cart.summaryLaterBalance" defaultText="Later balance:" as="span" />{" "}
                  <strong className="text-charcoal">{money(summary?.dueLaterCents ?? 0)}</strong>
                </div>
                {summary && summary.dueLaterCents > 0 ? (
                  <div>
                    <StudioText k="registration.cart.summaryLaterDate" defaultText="Later charge date:" as="span" />{" "}
                    <strong className="text-charcoal">{summary.laterPaymentDate ?? "None"}</strong>
                  </div>
                ) : null}
                {summary && summary.dueLaterCents > 0 ? (
                  <div className="space-y-3 rounded-2xl border border-clay/15 bg-clay/5 p-4 text-sm text-charcoal/75">
                    <StudioText
                      k="registration.cart.summaryAutoCharge"
                      defaultText={`We will automatically charge this card for the remaining balance of ${money(summary.dueLaterCents)} on ${summary.laterPaymentDate ?? "the scheduled date"}.`}
                      as="div"
                    />
                    <label className="flex items-start gap-3 text-sm text-charcoal">
                      <Checkbox
                        checked={laterChargeAuthorized}
                        onCheckedChange={(checked) => setLaterChargeAuthorized(Boolean(checked))}
                        className="mt-1"
                      />
                      <span>
                        <StudioText
                          k="registration.cart.autoChargeAgreement"
                          defaultText={`I authorize Sunnah Skills to automatically charge this card for the remaining balance of ${money(summary.dueLaterCents)} on ${summary.laterPaymentDate ?? "the scheduled date"}.`}
                        />
                      </span>
                    </label>
                    {!laterChargeAuthorized ? (
                      <StudioText
                        k="registration.cart.autoChargeAgreementRequired"
                        defaultText="You must agree to the automatic later charge before completing payment."
                        as="div"
                        className="text-xs text-clay"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
              </PremiumCard>
            </div>
          </StudioBlock>
        ) : null}
      </main>
    </MotionPage>
  );
}
