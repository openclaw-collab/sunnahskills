import React from "react";
import { cn } from "@/lib/utils";

type PremiumCardProps = React.ComponentPropsWithoutRef<"section"> & {
  title?: string;
  "data-testid"?: string;
};

export function PremiumCard({
  title,
  className,
  children,
  "data-testid": dataTestId,
  ...props
}: PremiumCardProps) {
  return (
    <section
      {...props}
      data-testid={dataTestId ?? "premium-card-root"}
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
