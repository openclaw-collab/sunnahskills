import { cn } from "@/lib/utils";
import type { ProgramSlug } from "@/lib/programConfig";

type ProgramVisualProps = {
  slug: ProgramSlug;
  variant?: "card" | "hero";
  className?: string;
};

const copyBySlug: Record<ProgramSlug, { label: string; subtitle: string }> = {
  bjj: {
    label: "Mat Control",
    subtitle: "Close the distance / control / finish",
  },
  archery: {
    label: "Target Focus",
    subtitle: "Target / breath / release",
  },
  outdoor: {
    label: "Fieldcraft",
    subtitle: "Map / shelter / stewardship",
  },
  bullyproofing: {
    label: "Boundaries First",
    subtitle: "Boundaries / awareness / calm",
  },
};

export function ProgramVisual({ slug, variant = "card", className }: ProgramVisualProps) {
  const meta = copyBySlug[slug];

  if (slug === "bjj") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-white/10 bg-charcoal text-cream",
          variant === "hero" ? "min-h-[340px]" : "aspect-[16/10]",
          className,
        )}
      >
        <div className="absolute inset-0 grid grid-cols-2 gap-3 p-4">
          <div className="rounded-[1.5rem] border border-moss/15 bg-white/5" />
          <div className="rounded-[1.5rem] border border-white/10 bg-white/8" />
          <div className="rounded-[1.5rem] border border-white/10 bg-white/8" />
          <div className="rounded-[1.5rem] border border-moss/15 bg-white/5" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,138,88,0.14)_0%,rgba(26,26,26,0.92)_70%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-full border border-moss/20 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-moss">
              Youth Grappling
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
              {variant === "hero" ? "Recurring" : "Technique-first"}
            </div>
          </div>
          <div className="self-center rounded-full border border-moss/20 bg-white px-5 py-3 text-[10px] font-mono-label uppercase tracking-[0.2em] text-charcoal/65 shadow-sm">
            {meta.label}
          </div>
          <div className="space-y-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
            <div>{meta.subtitle}</div>
            <div>Age-group training on the mats</div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "archery") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-white/10 bg-charcoal text-cream",
          variant === "hero" ? "min-h-[340px]" : "aspect-[16/10]",
          className,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,88,51,0.18)_0%,rgba(26,26,26,0.92)_68%)]" />
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/20" />
          <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/20" />
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/35" />
          <div className="absolute left-[14%] top-[22%] h-px w-[64%] rotate-[18deg] bg-cream/30" />
          <div className="absolute left-[72%] top-[33%] size-2 rounded-full bg-clay shadow-[0_0_0_8px_rgba(204,88,51,0.18)]" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-full border border-clay/25 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-clay">
              Sunnah Practice
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
              Seasonal
            </div>
          </div>
          <div className="self-center rounded-full border border-cream/20 bg-cream/10 px-5 py-3 text-[10px] font-mono-label uppercase tracking-[0.2em] text-cream">
            {meta.label}
          </div>
          <div className="space-y-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
            <div>{meta.subtitle}</div>
            <div>Controlled release and consistent stance</div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "outdoor") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-white/10 bg-charcoal text-cream",
          variant === "hero" ? "min-h-[340px]" : "aspect-[16/10]",
          className,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,138,88,0.12)_0%,rgba(26,26,26,0.95)_72%)]" />
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-30 text-moss">
          <path d="M20 100 Q 60 50, 100 100 T 180 100" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M10 120 Q 50 70, 90 120 T 190 120" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M30 80 Q 70 30, 110 80 T 170 80" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M 0 100 L 200 100" fill="none" stroke="#CC5833" strokeWidth="0.5" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="3" fill="#CC5833" />
        </svg>
        <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-full border border-moss/25 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-moss">
              Field Ready
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
              Workshops
            </div>
          </div>
          <div className="self-center rounded-full border border-moss/20 bg-charcoal/75 px-5 py-3 text-[10px] font-mono-label uppercase tracking-[0.2em] text-cream">
            {meta.label}
          </div>
          <div className="space-y-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
            <div>{meta.subtitle}</div>
            <div>Navigation, shelter, and stewardship</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 bg-charcoal text-cream",
        variant === "hero" ? "min-h-[340px]" : "aspect-[16/10]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,88,51,0.16)_0%,rgba(26,26,26,0.95)_70%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-2 border-cream/20" />
        <div className="absolute w-48 h-48 rounded-full border border-cream/10" />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/75">
            Safety First
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
            Short Series
          </div>
        </div>
        <div className="self-center rounded-full border border-cream/20 bg-white/10 px-5 py-3 text-[10px] font-mono-label uppercase tracking-[0.2em] text-cream">
          {meta.label}
        </div>
        <div className="space-y-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
          <div>{meta.subtitle}</div>
          <div>Boundaries, awareness, and calm response</div>
        </div>
      </div>
    </div>
  );
}
