import React from "react";
import { StatusDot } from "@/components/brand/StatusDot";

export type ProgressStep = {
  id: string;
  label: string;
};

type ProgressIndicatorProps = {
  steps: ProgressStep[];
  currentStepIndex: number;
  className?: string;
};

export function ProgressIndicator({ steps, currentStepIndex, className }: ProgressIndicatorProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isComplete = idx < currentStepIndex;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={[
                  "w-2.5 h-2.5 rounded-full border",
                  isComplete
                    ? "bg-moss border-moss"
                    : isActive
                      ? "bg-clay border-clay"
                      : "bg-transparent border-charcoal/20",
                ].join(" ")}
                aria-hidden="true"
              />
              {isActive ? <StatusDot ariaLabel={`Current step: ${step.label}`} /> : null}
              <div
                className={[
                  "font-mono-label text-[10px] uppercase tracking-[0.18em]",
                  isActive ? "text-charcoal" : isComplete ? "text-moss" : "text-charcoal/50",
                ].join(" ")}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

