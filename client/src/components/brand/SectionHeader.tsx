import React from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  className?: string;
};

export function SectionHeader({ eyebrow, title, className }: SectionHeaderProps) {
  return (
    <header
      data-testid="section-header-root"
      className={cn("flex flex-col gap-2 max-w-2xl", className)}
    >
      {eyebrow ? (
        <span className="font-mono-label text-[11px] uppercase tracking-[0.2em] text-moss/80">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-heading text-2xl md:text-3xl text-charcoal tracking-tight">
        {title}
      </h2>
    </header>
  );
}

