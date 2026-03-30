import { cn } from "@/lib/utils";
import type { ProgramSlug } from "@/lib/programConfig";
import { PROGRAMS } from "@/lib/programConfig";

type ProgramVisualProps = {
  slug: ProgramSlug;
  variant?: "card" | "hero";
  className?: string;
};

type OverlayCopy = {
  label: string;
  subtitle: string;
  footer: string;
  leftChip: string;
  rightChip: (v: "card" | "hero") => string;
  /** Optional chip / center pill styling tweaks */
  centerClassName?: string;
};

const overlayBySlug: Record<ProgramSlug, OverlayCopy> = {
  bjj: {
    label: "Mat Control",
    subtitle: "Close the distance / control / finish",
    footer: "Age-group training on the mats",
    leftChip: "Youth Grappling",
    rightChip: (v) => (v === "hero" ? "Recurring" : "Technique-first"),
  },
  archery: {
    label: "Target Focus",
    subtitle: "Target / breath / release",
    footer: "Controlled release and consistent stance",
    leftChip: "Sunnah Practice",
    rightChip: () => "Seasonal",
    centerClassName: "border-cream/20 bg-cream/10 text-cream",
  },
  outdoor: {
    label: "Fieldcraft",
    subtitle: "Map / shelter / stewardship",
    footer: "Navigation, shelter, and stewardship",
    leftChip: "Field Ready",
    rightChip: () => "Workshops",
    centerClassName: "border-moss/20 bg-charcoal/75 text-cream",
  },
  bullyproofing: {
    label: "Boundaries First",
    subtitle: "Boundaries / awareness / calm",
    footer: "Boundaries, awareness, and calm response",
    leftChip: "Safety First",
    rightChip: () => "Short Series",
    centerClassName: "border-cream/20 bg-white/10 text-cream",
  },
  swimming: {
    label: "Water Confidence",
    subtitle: "Breath / balance / comfort",
    footer: "Safety-first progression in the water",
    leftChip: "Coming Soon",
    rightChip: () => "Seasonal",
    centerClassName: "border-cream/20 bg-white/10 text-cream",
  },
  horseback: {
    label: "Ride Calm",
    subtitle: "Posture / care / balance",
    footer: "Supervised horseback instruction",
    leftChip: "Coming Soon",
    rightChip: () => "Seasonal",
    centerClassName: "border-cream/20 bg-white/10 text-cream",
  },
};

export function ProgramVisual({ slug, variant = "card", className }: ProgramVisualProps) {
  const program = PROGRAMS[slug];
  const meta = overlayBySlug[slug];
  const { src, alt, objectPosition } = program.heroImage;

  const centerPill = cn(
    "self-center rounded-full border px-5 py-3 text-[10px] font-mono-label uppercase tracking-[0.2em] shadow-sm",
    meta.centerClassName ??
      "border-moss/20 bg-white px-5 py-3 text-charcoal/65 shadow-sm",
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 bg-charcoal text-cream",
        variant === "hero" ? "min-h-[320px] md:min-h-[400px]" : "min-h-[18rem] aspect-[16/10] xl:aspect-[5/4]",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: objectPosition ?? "center" }}
        loading={variant === "hero" ? "eager" : "lazy"}
        decoding="async"
      />

      {/* Readability scrim — full-bleed photo + brand-consistent darkening */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/55 to-charcoal/20"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_40%,transparent_0%,rgba(26,26,26,0.35)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-between p-5 md:p-6 xl:p-7">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "rounded-full border bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em]",
              slug === "bjj" && "border-moss/20 text-moss",
              slug === "archery" && "border-clay/25 text-clay",
              slug === "outdoor" && "border-moss/25 text-moss",
              slug === "bullyproofing" && "border-cream/20 text-cream/75",
            )}
          >
            {meta.leftChip}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/70">
            {meta.rightChip(variant)}
          </div>
        </div>

        <div className={cn(centerPill, "xl:px-6 xl:py-3.5")}>{meta.label}</div>

        <div className="space-y-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/80 xl:text-[11px]">
          <div>{meta.subtitle}</div>
          <div className="text-cream/65">{meta.footer}</div>
        </div>
      </div>
    </div>
  );
}
