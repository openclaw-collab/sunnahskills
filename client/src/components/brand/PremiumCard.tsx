import React from "react";
import { cn } from "@/lib/utils";

type PremiumCardProps = {
  title?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PremiumCard({ title, className, children }: PremiumCardProps) {
  return (
    <section
      data-testid="premium-card-root"
      className={cn(
        "rounded-[2.5rem] bg-cream text-charcoal",
        "border border-moss/10 shadow-sm",
        "p-6 md:p-8 space-y-4",
        className,
      )}
    >
      {title ? (
        <h3 className="font-heading text-lg md:text-xl tracking-tight">{title}</h3>
      ) : null}
      {children}
    </section>
  );
}

