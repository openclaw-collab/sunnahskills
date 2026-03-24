import { Link } from "wouter";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

export default function NotFound() {
  return (
    <MotionPage className="bg-cream min-h-[80vh] pb-24">
      <div className="noise-overlay" />
      <main className="max-w-5xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="404" title="Page not found" className="mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <MotionDiv delay={0.02}>
            <PremiumCard className="bg-white border border-charcoal/10">
            <p className="font-body text-sm text-charcoal/70 leading-relaxed">
              We couldn&apos;t find that page. Use the links below to head back to the main site and continue exploring Sunnah Skills.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <ClayButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/">Return home</Link>
              </ClayButton>
              <ClayButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] bg-transparent text-charcoal border border-charcoal/15 shadow-none hover:shadow-none hover:bg-charcoal/5">
                <Link href="/programs">Browse programs</Link>
              </ClayButton>
            </div>
            </PremiumCard>
          </MotionDiv>

          <MotionDiv delay={0.08}>
            <DarkCard>
            <div className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em] mb-4">
              Need a quick route?
            </div>
            <div className="text-cream/70 font-body text-sm leading-relaxed">
              Start with the program overview, check the weekly schedule, or open the techniques library to see how we teach movement step by step.
            </div>
            </DarkCard>
          </MotionDiv>
        </div>
      </main>
    </MotionPage>
  );
}
