import React from "react";
import { cn } from "@/lib/utils";

type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function MagneticButton({ className, children, ...props }: MagneticButtonProps) {
  const labelId = React.useId();

  const ariaProps: React.AriaAttributes & { "aria-labelledby"?: string } = {};
  if ("aria-label" in props && props["aria-label"]) {
    ariaProps["aria-label"] = props["aria-label"];
    ariaProps["aria-labelledby"] = labelId;
  }

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center px-5 py-2 rounded-full",
        "bg-moss text-cream text-sm font-medium",
        "transition-transform transition-shadow duration-200 ease-out",
        "hover:-translate-y-0.5 hover:scale-[1.02]",
        "hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)]",
        "hover:ring-2 hover:ring-clay/60 hover:ring-offset-2 hover:ring-offset-cream",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        className,
      )}
      {...props}
      {...ariaProps}
    >
      <span id={labelId}>{children}</span>
    </button>
  );
}

