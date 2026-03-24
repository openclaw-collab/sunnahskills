import React from "react";
import type { ProgramConfig } from "@/lib/programConfig";
import { TelemetryCard } from "@/components/brand/TelemetryCard";

type ProgramSummaryCardProps = {
  program: ProgramConfig;
  selected?: {
    sessionLabel?: string;
    priceLabel?: string;
  };
};

export function ProgramSummaryCard({ program, selected }: ProgramSummaryCardProps) {
  return (
    <TelemetryCard title={program.name} label="selected program">
      <div className="space-y-3 font-body text-sm text-charcoal/70">
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
            Age range
          </div>
          <div className="mt-1">{program.ageRangeLabel}</div>
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
            Schedule
          </div>
          <div className="mt-1">{selected?.sessionLabel ?? program.scheduleBlurb}</div>
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
            Pricing
          </div>
          <div className="mt-1">{selected?.priceLabel ?? program.pricingBlurb}</div>
        </div>
      </div>
    </TelemetryCard>
  );
}

