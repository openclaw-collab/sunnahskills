import React from "react";
import { Link, useLocation } from "wouter";
import type { ProgramSlug } from "@/lib/programConfig";
import { getProgramConfig } from "@/lib/programConfig";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { useRegistration, type BjjSpecific } from "@/hooks/useRegistration";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { ProgramSummaryCard } from "@/components/registration/ProgramSummaryCard";
import { StepGuardianInfo } from "@/components/registration/StepGuardianInfo";
import { StepStudentInfo } from "@/components/registration/StepStudentInfo";
import { StepProgramDetails } from "@/components/registration/StepProgramDetails";
import { StepWaivers } from "@/components/registration/StepWaivers";
import { StepPayment } from "@/components/registration/StepPayment";
import { ResumeBanner } from "@/components/registration/ResumeBanner";
import { OrderSummaryCard } from "@/components/registration/OrderSummaryCard";
import { WaitlistDialog } from "@/components/programs/WaitlistDialog";
import { blockingMessageThroughDetails } from "@/hooks/useStepValidation";
import { addLineToFamilyCart, loadFamilyCart } from "@/lib/familyCart";
import { queryClient } from "@/lib/queryClient";
import { useGuardianSession, useGuardianStudents } from "@/hooks/useGuardianSession";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

export function ProgramRegistrationPage({ slug }: { slug: ProgramSlug }) {
  const program = getProgramConfig(slug);
  const [, navigate] = useLocation();
  const { draft, updateDraft, steps, currentStepIndex, goBack, goNext, hasSavedDraft, resumeDraft, reset } =
    useRegistration(slug);
  const [registrationId, setRegistrationId] = React.useState<number | null>(null);
  const [enrollmentOrderId, setEnrollmentOrderId] = React.useState<number | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [waitlistOpen, setWaitlistOpen] = React.useState(false);
  const guardianSession = useGuardianSession();
  const guardianStudents = useGuardianStudents(Boolean(guardianSession.data?.authenticated));

  if (!program) return null;

  const isAuthenticatedGuardian = Boolean(guardianSession.data?.authenticated);

  React.useEffect(() => {
    if (!guardianSession.data?.authenticated) return;
    updateDraft((prev) => ({
      ...prev,
      guardian: {
        ...prev.guardian,
        fullName: prev.guardian.fullName || guardianSession.data?.fullName || "",
        email: guardianSession.data?.email || prev.guardian.email,
        phone: prev.guardian.phone || guardianSession.data?.phone || "",
      },
    }));
  }, [
    guardianSession.data?.authenticated,
    guardianSession.data?.email,
    guardianSession.data?.fullName,
    guardianSession.data?.phone,
    updateDraft,
  ]);

  if (program.enrollmentStatus !== "open") {
    return (
      <>
        <div className="bg-cream min-h-screen pb-24">
          <div className="noise-overlay" />
          <main className="mx-auto max-w-2xl px-6 pt-28">
            <StudioBlock id={`registration.${slug}.waitlist`} label={`${program.name} waitlist`}>
              <SectionHeader
                eyebrow={<StudioText k={`registration.${slug}.eyebrow`} defaultText="Registration" />}
                title={<StudioText k={`registration.${slug}.title`} defaultText={program.name} />}
                className="mb-8"
              />
              <PremiumCard className="space-y-6 border border-charcoal/10 bg-white p-8">
                <StudioText
                  k={`registration.${slug}.waitlistCopy`}
                  defaultText="Online registration for this program isn't open yet. Join the waitlist and we'll reach out when a cohort is scheduled."
                  as="p"
                  className="font-body text-sm leading-relaxed text-charcoal/75"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <OutlineButton
                    type="button"
                    className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                    onClick={() => setWaitlistOpen(true)}
                  >
                    Join waitlist
                  </OutlineButton>
                  <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                    <Link href={program.detailPath}>Back to program</Link>
                  </OutlineButton>
                </div>
              </PremiumCard>
            </StudioBlock>
          </main>
        </div>

        <WaitlistDialog
          open={waitlistOpen}
          onOpenChange={setWaitlistOpen}
          programId={program.slug}
          programName={program.name}
        />
      </>
    );
  }

  if (program.slug === "bjj" && guardianSession.isLoading) {
    return (
      <div className="bg-cream min-h-screen pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-2xl px-6 pt-28">
          <StudioBlock id="registration.bjj.loading" label="BJJ loading state">
            <PremiumCard className="space-y-4 border border-charcoal/10 bg-white p-8">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Guardian account</div>
              <StudioText
                k="registration.bjj.loadingCopy"
                defaultText="Loading your guardian session…"
                as="p"
                className="font-body text-sm text-charcoal/70"
              />
            </PremiumCard>
          </StudioBlock>
        </main>
      </div>
    );
  }

  if (program.slug === "bjj" && !isAuthenticatedGuardian) {
    return (
      <div className="bg-cream min-h-screen pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-2xl px-6 pt-28">
          <StudioBlock id="registration.bjj.signin" label="BJJ guardian sign-in gate">
            <SectionHeader
              eyebrow={<StudioText k="registration.bjj.signinEyebrow" defaultText="Registration" />}
              title={<StudioText k="registration.bjj.signinTitle" defaultText="Sign in before you register" />}
              className="mb-8"
            />
            <PremiumCard className="space-y-6 border border-charcoal/10 bg-white p-8">
              <StudioText
                k="registration.bjj.signinCopy"
                defaultText="BJJ enrollment now runs through a guardian account so saved students, payment plans, and later charges stay attached to the right household."
                as="p"
                className="font-body text-sm leading-relaxed text-charcoal/75"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href={`/register?next=${encodeURIComponent(`/programs/${program.slug}/register`)}`}>Sign in to continue</Link>
                </ClayButton>
                <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href={program.detailPath}>Back to program</Link>
                </OutlineButton>
              </div>
            </PremiumCard>
          </StudioBlock>
        </main>
      </div>
    );
  }

  async function setupPayment(regId: number) {
    if (program?.slug === "bjj" && enrollmentOrderId) {
      const intentRes = await fetch("/api/payments/create-order-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentOrderId,
          discountCode: draft.payment.discountCode || undefined,
        }),
      });
      const intentJson = (await intentRes.json().catch(() => null)) as any;
      if (!intentRes.ok || !intentJson?.clientSecret) {
        throw new Error(intentJson?.error ?? "Couldn't start payment. Try again in a moment.");
      }
      return intentJson.clientSecret as string;
    }

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
          selectedPriceId={draft.programDetails.priceId}
          onDiscountCodeChange={(code) =>
            updateDraft((prev) => ({ ...prev, payment: { ...prev.payment, discountCode: code } }))
          }
          bjjLinePreview={
            program.slug === "bjj"
              ? {
                  track: (draft.programDetails.programSpecific as BjjSpecific).bjjTrack,
                  paymentChoice: draft.programDetails.paymentChoice,
                  priceId: draft.programDetails.priceId,
                }
              : undefined
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
                  if (existing && existing.account.email.trim().toLowerCase() !== email) {
                    window.alert(
                      "Your cart was started with a different guardian email. Clear the cart from the cart page or use the same email.",
                    );
                    return;
                  }
                  addLineToFamilyCart(
                    {
                      fullName: draft.guardian.fullName,
                      email: guardianSession.data?.email || draft.guardian.email,
                      phone: draft.guardian.phone,
                      emergencyContactName: draft.guardian.emergencyContactName,
                      emergencyContactPhone: draft.guardian.emergencyContactPhone,
                      accountRole: draft.guardian.relationship === "self" ? "adult_student" : "parent_guardian",
                      notes: draft.guardian.notes,
                    },
                    {
                      participant: {
                        participantType: "child",
                        fullName: draft.student.fullName,
                        dateOfBirth: draft.student.dateOfBirth,
                        gender: draft.student.gender,
                        medicalNotes: draft.student.medicalNotes,
                        experienceLevel: draft.student.skillLevel || "beginner",
                      },
                      paymentChoice: draft.programDetails.paymentChoice === "plan" ? "plan" : "full",
                      programDetails: {
                        sessionId: draft.programDetails.sessionId ?? 0,
                        priceId: draft.programDetails.priceId ?? 0,
                        programSpecific: {
                          bjjTrack: (draft.programDetails.programSpecific as BjjSpecific).bjjTrack,
                          notes: (draft.programDetails.programSpecific as BjjSpecific).notes,
                        },
                      },
                    },
                  );
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
            if (program?.slug === "bjj") {
              const regRes = await fetch("/api/register/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  guardian: {
                    ...draft.guardian,
                    email: guardianSession.data?.email || draft.guardian.email,
                  },
                  lines: [
                    {
                      student: draft.student,
                      programDetails: {
                        sessionId: draft.programDetails.sessionId,
                        priceId: draft.programDetails.priceId,
                        preferredStartDate: draft.programDetails.preferredStartDate ?? "",
                        scheduleChoice: draft.programDetails.scheduleChoice ?? "",
                        programSpecific: draft.programDetails.programSpecific,
                      },
                      paymentChoice: draft.programDetails.paymentChoice,
                    },
                  ],
                  waivers: draft.waivers,
                }),
              });

              const regJson = (await regRes.json().catch(() => null)) as any;
              if (!regRes.ok) {
                throw new Error(regJson?.error ?? "Failed to submit registration");
              }
              if (regJson?.summary?.waitlisted) {
                navigate(`/registration/waitlist?pos=1&program=${encodeURIComponent(program!.name)}`);
                return;
              }
              const oid = Number(regJson?.enrollmentOrderId);
              const rids = regJson?.registrationIds as number[] | undefined;
              if (!Number.isInteger(oid) || oid <= 0 || !Array.isArray(rids) || !rids[0]) {
                throw new Error("Invalid order response");
              }
              setEnrollmentOrderId(oid);
              setRegistrationId(rids[0]);
              const secret = await fetch("/api/payments/create-order-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  enrollmentOrderId: oid,
                  discountCode: draft.payment.discountCode || undefined,
                }),
              }).then(async (response) => {
                const payload = (await response.json().catch(() => null)) as any;
                if (!response.ok || !payload?.clientSecret) {
                  throw new Error(payload?.error ?? "Failed to create payment intent");
                }
                return payload.clientSecret as string;
              });
              setClientSecret(secret);
              await queryClient.invalidateQueries({ queryKey: ["/api/guardian/students"] });
              goNext();
              return;
            }

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
            return (
              <StepStudentInfo
                draft={draft}
                updateDraft={updateDraft}
                savedStudents={guardianStudents.data?.students ?? []}
                onSelectSavedStudent={(student) => {
                  const dob = student.date_of_birth ?? "";
                  const dobTime = dob ? Date.parse(dob) : NaN;
                  const age = Number.isFinite(dobTime) ? Math.floor((Date.now() - dobTime) / 31557600000) : null;
                  updateDraft((prev) => ({
                    ...prev,
                    student: {
                      ...prev.student,
                      fullName: student.full_name,
                      dateOfBirth: dob,
                      age,
                      gender: student.gender ?? "",
                      medicalNotes: student.medical_notes ?? "",
                    },
                  }));
                }}
              />
            );
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
