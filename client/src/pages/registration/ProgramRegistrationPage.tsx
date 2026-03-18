import React from "react";
import type { ProgramSlug } from "@/lib/programConfig";
import { getProgramConfig } from "@/lib/programConfig";
import { useRegistration } from "@/hooks/useRegistration";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { ProgramSummaryCard } from "@/components/registration/ProgramSummaryCard";
import { StepGuardianInfo } from "@/components/registration/StepGuardianInfo";
import { StepStudentInfo } from "@/components/registration/StepStudentInfo";
import { StepProgramDetails } from "@/components/registration/StepProgramDetails";
import { StepWaivers } from "@/components/registration/StepWaivers";
import { StepPayment } from "@/components/registration/StepPayment";

export function ProgramRegistrationPage({ slug }: { slug: ProgramSlug }) {
  const program = getProgramConfig(slug);
  const { draft, updateDraft, steps, currentStepIndex, goBack, goNext } = useRegistration(slug);
  const [registrationId, setRegistrationId] = React.useState<number | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!program) return null;

  return (
    <RegistrationWizard
      program={program}
      steps={steps}
      currentStepIndex={currentStepIndex}
      onBack={goBack}
      onNext={() => {
        // When leaving waivers -> payment, create registration + payment intent.
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
          if (!regRes.ok || !regJson?.registrationId) {
            throw new Error(regJson?.error ?? "Failed to submit registration");
          }

          setRegistrationId(regJson.registrationId);

          const intentRes = await fetch("/api/payments/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              registrationId: regJson.registrationId,
              discountCode: draft.payment.discountCode || undefined,
            }),
          });

          const intentJson = (await intentRes.json().catch(() => null)) as any;
          if (!intentRes.ok || !intentJson?.clientSecret) {
            throw new Error(intentJson?.error ?? "Failed to create payment intent");
          }

          setClientSecret(intentJson.clientSecret);
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
        // Final submit is handled by Stripe confirmation in StepPayment.
        // Keep this as a no-op to avoid double submitting.
      }}
      sidebar={<ProgramSummaryCard program={program} />}
      renderStep={({ stepId }) => {
        if (stepId === "guardian") return <StepGuardianInfo draft={draft} updateDraft={updateDraft} />;
        if (stepId === "student") return <StepStudentInfo draft={draft} updateDraft={updateDraft} />;
        if (stepId === "details") return <StepProgramDetails draft={draft} updateDraft={updateDraft} />;
        if (stepId === "waivers")
          return (
            <div className="space-y-4">
              {error ? <div className="text-sm font-body text-clay">{error}</div> : null}
              <StepWaivers draft={draft} updateDraft={updateDraft} />
            </div>
          );
        if (stepId === "payment")
          return (
            <StepPayment
              draft={draft}
              updateDraft={updateDraft}
              clientSecret={clientSecret}
              returnUrl={`${window.location.origin}/registration/success?rid=${registrationId ?? ""}`}
            />
          );
        return null;
      }}
    />
  );
}

