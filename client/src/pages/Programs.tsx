import { useState } from "react";
import { Link } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionDiv, MotionPage, MotionSection } from "@/components/motion/PageMotion";
import { ProgramVisual } from "@/components/programs/ProgramVisual";
import { WaitlistDialog } from "@/components/programs/WaitlistDialog";
import { PROGRAMS } from "@/lib/programConfig";

const PROGRAM_ORDER = [
  PROGRAMS.bjj,
  PROGRAMS.archery,
  PROGRAMS.outdoor,
  PROGRAMS.bullyproofing,
];

const Programs = () => {
  const [waitlistProgram, setWaitlistProgram] = useState<(typeof PROGRAM_ORDER)[number] | null>(null);
  return (
    <>
      <MotionPage className="bg-cream min-h-screen pb-24">
        <div className="noise-overlay" />
        <main className="max-w-6xl mx-auto px-6 pt-28">
          <StudioBlock id="programs.header" label="Header + intro" page="Programs">
            <SectionHeader
              eyebrow={<StudioText k="programs.eyebrow" defaultText="Programs" as="span" className="inline" />}
              title={<StudioText k="programs.title" defaultText="Choose the Right Fit" as="span" className="inline" />}
              className="mb-10"
            />
            <p className="font-body text-pretty text-sm text-charcoal/70 max-w-2xl mb-12">
                <StudioText
                  k="programs.intro"
                  defaultText="Brazilian Jiu-Jitsu is the only live enrollment track right now. Open your Family & Member Account when you're ready, then complete registration in one flow."
                  as="span"
                  className="inline"
                  multiline
                />
            </p>
          </StudioBlock>

          <MotionSection className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PROGRAM_ORDER.map((program, index) => (
              <MotionDiv key={program.slug} className="h-full" delay={index * 0.04}>
                <PremiumCard className="group h-full overflow-hidden border border-charcoal/10 bg-white p-0 shadow-sm transition-shadow duration-200 hover:shadow-[0_30px_80px_rgba(26,26,26,0.10)]">
                  <ProgramVisual slug={program.slug} variant="card" />

                  <div className="space-y-6 p-6 md:p-8">
                    <div className="space-y-3">
                      <div className="font-heading text-2xl text-charcoal">{program.name}</div>
                      <p className="font-body text-pretty text-sm leading-relaxed text-charcoal/70">
                        {program.shortPitch}
                      </p>
                      <p className="font-body text-pretty text-sm leading-relaxed text-charcoal/60">
                        {program.heroLead}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-charcoal/10 bg-cream/40 p-4">
                      <div className="mb-3 font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                        Track details
                      </div>
                      <ul className="space-y-2 font-body text-sm text-charcoal/75">
                        {program.overviewBullets.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-clay" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-charcoal/10 pt-5">
                      <div className="mb-4 text-[10px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1} · {program.scheduleBlurb}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {program.enrollmentStatus === "open" ? (
                          <ClayButton asChild className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                            <Link href={program.slug === "bjj" ? "/register" : program.registerPath}>Register now</Link>
                          </ClayButton>
                        ) : (
                          <OutlineButton
                            type="button"
                            className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                            onClick={() => setWaitlistProgram(program)}
                          >
                            Join waitlist
                          </OutlineButton>
                        )}
                        <OutlineButton asChild className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                          <Link href={program.detailPath}>Learn more</Link>
                        </OutlineButton>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </MotionDiv>
            ))}
          </MotionSection>

          <MotionSection className="mt-16">
            <PremiumCard className="border border-charcoal/10 bg-white">
              <div className="grid gap-8 md:grid-cols-3">
                {PROGRAM_ORDER.map((program, index) => (
                  <MotionDiv key={program.slug} delay={index * 0.04} className="space-y-3">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                      {program.name}
                    </div>
                    <p className="font-body text-sm leading-relaxed text-charcoal/70">{program.heroLead}</p>
                  </MotionDiv>
                ))}
              </div>
            </PremiumCard>
          </MotionSection>

          <div className="mt-14 flex justify-center">
            <ClayButton asChild className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/register">Open Your Family &amp; Member Account</Link>
            </ClayButton>
          </div>
        </main>
      </MotionPage>

      {waitlistProgram ? (
        <WaitlistDialog
          open={Boolean(waitlistProgram)}
          onOpenChange={(open) => {
            if (!open) setWaitlistProgram(null);
          }}
          programId={waitlistProgram.slug}
          programName={waitlistProgram.name}
        />
      ) : null}
    </>
  );
};

export default Programs;
