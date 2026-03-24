import React from "react";
import { cn } from "@/lib/utils";

type DarkCardProps = {
  className?: string;
  children?: React.ReactNode;
};

export function DarkCard({ className, children }: DarkCardProps) {
  return (
    <div
      data-testid="dark-card-root"
      className={cn(
        "relative rounded-[2rem] border border-moss/15",
        "bg-charcoal text-cream",
        "bg-gradient-to-b from-black/80 via-charcoal to-charcoal",
        "p-6 md:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.65)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

