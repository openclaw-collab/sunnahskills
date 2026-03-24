import type { ProgramConfig } from "@/lib/programConfig";

/**
 * Full-bleed photo + scrim for program detail page `<header>` backgrounds.
 * Image is decorative (page title describes the program); alt="" per WCAG.
 */
export function ProgramPageHeroMedia({ program }: { program: ProgramConfig }) {
  const { src, objectPosition } = program.heroImage;
  return (
    <>
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: objectPosition ?? "center" }}
        decoding="async"
        fetchPriority="high"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-charcoal/95 via-charcoal/78 to-charcoal/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/88 via-charcoal/35 to-charcoal/45"
        aria-hidden
      />
    </>
  );
}
