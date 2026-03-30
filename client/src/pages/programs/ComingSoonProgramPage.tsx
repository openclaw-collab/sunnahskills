import { useState } from "react";
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StatusDot } from "@/components/brand/StatusDot";
import { ProgramPageHeroMedia } from "@/components/programs/ProgramPageHeroMedia";
import { WaitlistDialog } from "@/components/programs/WaitlistDialog";
import { MotionDiv, MotionPage, MotionSection } from "@/components/motion/PageMotion";
import { PROGRAMS, getProgramTypeLabel, type ProgramConfig } from "@/lib/programConfig";

type ComingSoonProgramPageProps = {
  program: ProgramConfig;
};

export function ComingSoonProgramPage({ program }: ComingSoonProgramPageProps) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const tagLine = `${getProgramTypeLabel(program.type)} · Coming soon`;

  return (
    <>
      <MotionPage className="min-h-screen bg-cream">
        <div className="noise-overlay" />

        <header className="relative min-h-[420px] overflow-hidden bg-charcoal text-cream md:min-h-[520px]">
          <div className="absolute inset-0">
            <ProgramPageHeroMedia program={program} />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-28 md:pb-20 md:pt-36">
            <div className="max-w-3xl">
              <MotionDiv delay={0.04}>
                <p className="mb-6 flex items-center gap-2 text-clay font-mono-label text-xs uppercase tracking-[0.18em]">
                  <StatusDot ariaLabel="Coming soon" />
                  {tagLine}
                </p>
                <h1 className="text-balance font-heading text-5xl leading-none tracking-tight text-cream md:text-7xl">
                  {program.name}
                </h1>
                <p className="mt-8 max-w-2xl text-pretty text-sm leading-relaxed text-cream/75 font-body md:text-base">
                  {program.heroLead}
                </p>
                <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-cream/65 font-body">
                  {program.shortPitch}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/80">
                    {program.ageRangeLabel}
                  </span>
                  {program.highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/80"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-12 flex flex-col gap-4 sm:flex-row">
                  <ClayButton
                    className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]"
                    onClick={() => setWaitlistOpen(true)}
                  >
                    Join waitlist
                  </ClayButton>
                  <Link href="/programs">
                    <OutlineButton className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em] border-cream/20 text-cream hover:bg-cream/10">
                      Browse programs
                    </OutlineButton>
                  </Link>
                  <Link href="/contact">
                    <OutlineButton className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em] border-cream/20 text-cream hover:bg-cream/10">
                      Contact us
                    </OutlineButton>
                  </Link>
                </div>
              </MotionDiv>
            </div>
          </div>
        </header>

        <MotionSection className="py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <MotionDiv delay={0.04} className="space-y-6">
              <SectionHeader eyebrow="Launch Notes" title="This program is being prepared now" />
              <p className="text-pretty font-body leading-relaxed text-charcoal/70">
                {program.heroLead} We’re keeping the details visible now so families can see what is coming,
                follow along, and move quickly once enrollment opens.
              </p>
              <p className="text-pretty font-body leading-relaxed text-charcoal/70">
                {program.scheduleBlurb} {program.pricingBlurb}
              </p>

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <MotionDiv delay={0.04}>
                  <PremiumCard className="border border-charcoal/10 bg-white">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                      What families will get
                    </div>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-charcoal/70 font-body">
                      {program.overviewBullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-clay" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </PremiumCard>
                </MotionDiv>

                <MotionDiv delay={0.08}>
                  <DarkCard>
                    <div className="flex items-center gap-3">
                      <StatusDot ariaLabel="Launch update" />
                      <span className="font-mono-label text-[11px] uppercase tracking-[0.2em] text-cream/70">
                        Launch update
                      </span>
                    </div>
                    <div className="mt-6 rounded-2xl border border-cream/10 bg-charcoal/40 p-5 text-sm leading-relaxed text-cream/80">
                      {program.nextSteps.map((step, index) => (
                        <div key={step} className={index === 0 ? "" : "mt-3"}>
                          {step}
                        </div>
                      ))}
                    </div>
                  </DarkCard>
                </MotionDiv>
              </div>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <PremiumCard className="h-full border border-charcoal/10 bg-white">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                  Program snapshot
                </div>
                <div className="mt-4 space-y-5">
                  <div>
                    <div className="font-heading text-2xl text-charcoal">{program.name}</div>
                    <p className="mt-2 text-pretty font-body text-sm leading-relaxed text-charcoal/70">
                      {program.shortPitch}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-charcoal/10 bg-cream/50 p-4">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                      Timing
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/70 font-body">
                      {program.scheduleBlurb}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-charcoal/10 bg-cream/50 p-4">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                      Pricing
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/70 font-body">
                      {program.pricingBlurb}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            </MotionDiv>
          </div>
        </MotionSection>

        <MotionSection className="border-y border-charcoal/5 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeader eyebrow="Why it matters" title="Coming soon, with the Sunnah Skills feel" />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {program.highlights.map((item, index) => (
                <MotionDiv key={item} delay={index * 0.04}>
                  <PremiumCard className="h-full border border-charcoal/10 bg-white">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </div>
                    <div className="mt-3 font-heading text-xl text-charcoal">{item}</div>
                    <p className="mt-3 text-pretty font-body text-sm leading-relaxed text-charcoal/70">
                      {program.overviewBullets[index % program.overviewBullets.length]}
                    </p>
                  </PremiumCard>
                </MotionDiv>
              ))}
            </div>
          </div>
        </MotionSection>

        <MotionSection className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <MotionDiv delay={0.04}>
              <PremiumCard className="bg-cream">
                <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                  <div>
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss">
                      Next step
                    </div>
                    <h2 className="mt-2 text-balance font-heading text-3xl tracking-tight text-charcoal md:text-4xl">
                      Stay close. We’ll open this one when it’s ready.
                    </h2>
                    <p className="mt-4 max-w-2xl text-pretty font-body text-charcoal/70">
                      {program.name} is not open yet, but the page is ready so families can check back, join the
                      waitlist, and see the launch details in one place.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                    <ClayButton
                      className="w-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] md:w-auto"
                      onClick={() => setWaitlistOpen(true)}
                    >
                      Join waitlist
                    </ClayButton>
                    <Link href="/programs">
                      <OutlineButton className="w-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] md:w-auto border-charcoal/15 text-charcoal hover:bg-charcoal/5">
                        Browse programs
                      </OutlineButton>
                    </Link>
                  </div>
                </div>
              </PremiumCard>
            </MotionDiv>
          </div>
        </MotionSection>
      </MotionPage>

      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        programId={program.slug}
        programName={program.name}
      />
    </>
  );
}
