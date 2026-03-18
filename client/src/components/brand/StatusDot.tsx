import React from "react";
import { cn } from "@/lib/utils";

type StatusDotProps = {
  ariaLabel?: string;
  className?: string;
};

export function StatusDot({ ariaLabel, className }: StatusDotProps) {
  return (
    <span
      data-testid="status-dot"
      aria-label={ariaLabel}
      className={cn(
        "inline-block w-2 h-2 rounded-full bg-clay",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.4)]",
        "animate-pulse",
        className,
      )}
    />
  );
}

