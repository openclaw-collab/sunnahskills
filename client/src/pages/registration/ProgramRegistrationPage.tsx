import React from "react";
import { Link, useLocation } from "wouter";
import type { ProgramSlug } from "@/lib/programConfig";
import { getProgramConfig } from "@/lib/programConfig";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { useRegistration } from "@/hooks/useRegistration";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { ProgramSummaryCard } from "@/components/registration/ProgramSummaryCard";
import { StepGuardianInfo } from "@/components/registration/StepGuardianInfo";
import { StepStudentInfo } from "@/components/registration/StepStudentInfo";
import { StepProgramDetails } from "@/components/registration/StepProgramDetails";
import { StepWaivers } from "@/components/registration/StepWaivers";
import { StepPayment } from "@/components/registration/StepPayment";
import { ResumeBanner } from "@/components/registration/ResumeBanner";
import { OrderSummaryCard } from "@/components/registration/OrderSummaryCard";
import { blockingMessageThroughDetails } from "@/hooks/useStepValidation";
import { addLineToFamilyCart, loadFamilyCart } from "@/lib/familyCart";

export function ProgramRegistrationPage({ slug }: { slug: ProgramSlug }) {
  const program = getProgramConfig(slug);
  const [, navigate] = useLocation();
  const { draft, updateDraft, steps, currentStepIndex, goBack, goNext, hasSavedDraft, resumeDraft, reset } =
    useRegistration(slug);
  const [registrationId, setRegistrationId] = React.useState<number | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!program) return null;

  if (program.enrollmentStatus !== "open") {
    return (
      <div className="bg-cream min-h-screen pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-2xl px-6 pt-28">
          <SectionHeader eyebrow="Registration" title={`${program.name}`} className="mb-8" />
          <PremiumCard className="space-y-6 border border-charcoal/10 bg-white p-8">
            <p className="font-body text-sm leading-relaxed text-charcoal/75">
              Online registration for this program isn&apos;t open yet. Join the waitlist and we&apos;ll reach out when a cohort
              is scheduled.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href={`/contact?interest=${program.slug}`}>Join waitlist</Link>
              </ClayButton>
              <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href={program.detailPath}>Back to program</Link>
              </OutlineButton>
            </div>
          </PremiumCard>
        </main>
      </div>
    );
  }

  async function setupPayment(regId: number) {
    const isRecurring = program!.type === "recurring";

    if (isRecurring) {
      // Try subscription endpoint first
      const subRes = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: regId,
          guardianEmail: draft.guardian.email,
          guardianName: draft.guardian.fullName,
          discountCode: draft.payment.discountCode || undefined,
          siblingCount: draft.programDetails.siblingCount,
        }),
      });
      const subJson = (await subRes.json().catch(() => null)) as any;

      // If subscription is configured and succeeded
      if (subRes.ok && subJson?.clientSecret) {
        return subJson.clientSecret as string;
      }

      // Graceful fallback: subscriptions_not_configured → use create-intent
      if (subJson?.error !== "subscriptions_not_configured") {
        throw new Error(subJson?.error ?? "Failed to create subscription");
      }
    }

    // One-time payment intent
    const intentRes = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId: regId,
        discountCode: draft.payment.discountCode || undefined,
        siblingCount: draft.programDetails.siblingCount,
      }),
    });
    const intentJson = (await intentRes.json().catch(() => null)) as any;
    if (!intentRes.ok || !intentJson?.clientSecret) {
      throw new Error(intentJson?.error ?? "Failed to create payment intent");
    }
    return intentJson.clientSecret as string;
  }

  const sidebar = (
    <div className="space-y-4">
      <ProgramSummaryCard program={program} />
      {currentStepIndex >= 2 && (
        <OrderSummaryCard
          program={program}
          siblingCount={draft.programDetails.siblingCount}
          discountCode={draft.payment.discountCode}
          onDiscountCodeChange={(code) =>
            updateDraft((prev) => ({ ...prev, payment: { ...prev.payment, discountCode: code } }))
          }
        />
      )}
    </div>
  );

  return (
    <>
      {hasSavedDraft && (
        <ResumeBanner
          programName={program.name}
          onResume={resumeDraft}
          onStartFresh={reset}
        />
      )}
      <RegistrationWizard
        program={program}
        steps={steps}
        currentStepIndex={currentStepIndex}
        footerExtra={
          program.slug === "bjj" && steps[currentStepIndex]?.id === "details" ? (
            <div className="flex flex-wrap gap-3 justify-end w-full">
              <OutlineButton
                type="button"
                className="px-5 py-2.5 text-[10px] uppercase tracking-[0.18em]"
                onClick={() => {
                  const msg = blockingMessageThroughDetails(draft);
                  if (msg) {
                    window.alert(msg);
                    return;
                  }
                  const existing = loadFamilyCart();
                  const email = draft.guardian.email.trim().toLowerCase();
                  if (existing && existing.guardian.email.trim().toLowerCase() !== email) {
                    window.alert(
                      "Your cart was started with a different guardian email. Clear the cart from the cart page or use the same email.",
                    );
                    return;
                  }
                  addLineToFamilyCart(draft.guardian, {
                    student: draft.student,
                    programDetails: draft.programDetails,
                  });
                  navigate("/registration/cart");
                }}
              >
                Add to cart
              </OutlineButton>
              <OutlineButton asChild className="px-5 py-2.5 text-[10px] uppercase tracking-[0.18em]">
                <Link href="/registration/cart">View cart</Link>
              </OutlineButton>
            </div>
          ) : null
        }
        onBack={goBack}
        onNext={() => {
          if (steps[currentStepIndex]?.id !== "waivers") {
            goNext();
            return;
          }

          if (loadingPayment || clientSecret) {
            goNext();
            return;
          }

          setError(null);
          setLoadingPayment(true);

          (async () => {
            const regRes = await fetch("/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                programSlug: draft.programSlug,
                guardian: draft.guardian,
                student: draft.student,
                programDetails: draft.programDetails,
                waivers: draft.waivers,
              }),
            });

            const regJson = (await regRes.json().catch(() => null)) as any;
            if (!regRes.ok) {
              throw new Error(regJson?.error ?? "Failed to submit registration");
            }

            // Handle waitlist
            if (regJson?.waitlisted) {
              navigate(`/registration/waitlist?pos=${regJson.position ?? 1}&program=${encodeURIComponent(program!.name)}`);
              return;
            }

            if (!regJson?.registrationId) {
              throw new Error("Invalid registration response");
            }

            setRegistrationId(regJson.registrationId);

            const secret = await setupPayment(regJson.registrationId);
            setClientSecret(secret);
            goNext();
          })()
            .catch((e) => {
              setError(e instanceof Error ? e.message : "Payment setup failed");
            })
            .finally(() => {
              setLoadingPayment(false);
            });
        }}
        onSubmit={() => {
          // Handled by Stripe confirmation in StepPayment
        }}
        sidebar={sidebar}
        renderStep={({ stepId }) => {
          if (stepId === "guardian")
            return <StepGuardianInfo draft={draft} updateDraft={updateDraft} />;
          if (stepId === "student")
            return <StepStudentInfo draft={draft} updateDraft={updateDraft} />;
          if (stepId === "details")
            return <StepProgramDetails draft={draft} updateDraft={updateDraft} />;
          if (stepId === "waivers")
            return (
              <div className="space-y-4">
                {loadingPayment && (
                  <div className="text-sm font-body text-charcoal/60 text-center py-2">
                    Setting up payment…
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm font-body text-clay">
                    {error}
                  </div>
                )}
                <StepWaivers draft={draft} updateDraft={updateDraft} />
              </div>
            );
          if (stepId === "payment")
            return (
              <StepPayment
                draft={draft}
                updateDraft={updateDraft}
                clientSecret={clientSecret}
                program={program!}
                returnUrl={`${window.location.origin}/registration/success?rid=${registrationId ?? ""}`}
              />
            );
          return null;
        }}
      />
    </>
  );
}
