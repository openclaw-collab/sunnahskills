import React, { type ReactNode, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProgramConfig } from "@/lib/programConfig";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { ProgressIndicator, type ProgressStep } from "@/components/registration/ProgressIndicator";
import { MotionPage } from "@/components/motion/PageMotion";

export type WizardStepRenderArgs = {
  stepId: string;
};

export type RegistrationWizardProps = {
  program: ProgramConfig;
  steps: ProgressStep[];
  currentStepIndex: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  sidebar?: ReactNode;
  renderStep: (args: WizardStepRenderArgs) => ReactNode;
};

const stepVariants = {
  initial: {
    opacity: 0,
    y: 14,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(3px)",
    transition: {
      duration: 0.18,
      ease: [0.55, 0, 1, 0.45] as const,
    },
  },
};

export function RegistrationWizard({
  program,
  steps,
  currentStepIndex,
  onBack,
  onNext,
  onSubmit,
  sidebar,
  renderStep,
}: RegistrationWizardProps) {
  const step = steps[currentStepIndex];
  const isLast = currentStepIndex === steps.length - 1;

  const footerCta = useMemo(() => {
    return isLast ? "Complete Payment" : "Continue";
  }, [isLast]);

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />

      <main className="max-w-6xl mx-auto px-6 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <SectionHeader eyebrow="Registration" title={program.name} />
            <p className="font-body text-sm text-charcoal/70 max-w-2xl">
              {program.shortPitch}
            </p>

            <PremiumCard className="bg-white border border-charcoal/10">
              <ProgressIndicator steps={steps} currentStepIndex={currentStepIndex} className="mb-6" />

              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                Step {currentStepIndex + 1} / {steps.length}: {step?.label}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step?.id ?? currentStepIndex}
                  className="mt-6"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {step ? renderStep({ stepId: step.id }) : null}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
                <OutlineButton
                  type="button"
                  onClick={onBack}
                  disabled={currentStepIndex === 0}
                  className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] disabled:opacity-50"
                >
                  Back
                </OutlineButton>

                <ClayButton
                  type="button"
                  onClick={isLast ? onSubmit : onNext}
                  className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]"
                >
                  {footerCta}
                </ClayButton>
              </div>
            </PremiumCard>
          </div>

          <div className="space-y-4">
            {sidebar ? (
              sidebar
            ) : (
              <TelemetryCard title="Summary" label={program.type}>
                <div className="space-y-2 text-sm text-charcoal/70 font-body">
                  <div>
                    <span className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                      Age range
                    </span>
                    <div className="mt-1">{program.ageRangeLabel}</div>
                  </div>
                  <div>
                    <span className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                      Schedule
                    </span>
                    <div className="mt-1">{program.scheduleBlurb}</div>
                  </div>
                  <div>
                    <span className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                      Pricing
                    </span>
                    <div className="mt-1">{program.pricingBlurb}</div>
                  </div>
                </div>
              </TelemetryCard>
            )}

            <TelemetryCard title="What happens next" label="after submit">
              <ul className="space-y-2 text-sm text-charcoal/70 font-body">
                {program.nextSteps.map((s) => (
                  <li key={s} className="flex gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-clay flex-none" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </TelemetryCard>
          </div>
        </div>
      </main>
    </MotionPage>
  );
}
