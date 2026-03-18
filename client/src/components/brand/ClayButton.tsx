import React from "react";
import { cn } from "@/lib/utils";

type ClayButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ClayButton({ className, children, ...props }: ClayButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-5 py-2 rounded-full",
        "bg-clay text-cream text-sm font-medium",
        "shadow-[0_18px_45px_rgba(0,0,0,0.35)] hover:shadow-[0_22px_55px_rgba(0,0,0,0.45)]",
        "transition-colors transition-shadow duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

