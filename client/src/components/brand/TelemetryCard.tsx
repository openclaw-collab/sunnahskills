import React from "react";
import { cn } from "@/lib/utils";

type TelemetryCardProps = {
  title: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function TelemetryCard({
  title,
  label,
  icon,
  className,
  children,
}: TelemetryCardProps) {
  return (
    <div
      data-testid="telemetry-card-root"
      className={cn(
        "bg-white rounded-[2rem] border border-moss/10 p-6 flex flex-col gap-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="text-moss flex items-center justify-center">{icon}</div>
          ) : null}
          <div className="flex flex-col">
            <span
              data-testid="telemetry-card-label"
              className="font-mono-label text-[11px] uppercase tracking-[0.18em] text-moss"
            >
              {label}
            </span>
            <h3 className="font-heading text-base md:text-lg text-charcoal mt-1">
              {title}
            </h3>
          </div>
        </div>
      </div>
      {children ? <div className="mt-2 text-sm text-charcoal/80">{children}</div> : null}
    </div>
  );
}

