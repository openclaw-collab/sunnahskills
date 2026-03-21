import { Link } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionDiv, MotionPage, MotionSection } from "@/components/motion/PageMotion";
import { ProgramVisual } from "@/components/programs/ProgramVisual";
import { PROGRAMS, getProgramTypeLabel } from "@/lib/programConfig";

const PROGRAM_ORDER = [
  PROGRAMS.bjj,
  PROGRAMS.archery,
  PROGRAMS.outdoor,
  PROGRAMS.bullyproofing,
];

const Programs = () => {
  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <StudioBlock id="programs.header" label="Header + intro" page="Programs">
          <SectionHeader
            eyebrow={<StudioText k="programs.eyebrow" defaultText="Programs" as="span" className="inline" />}
            title={<StudioText k="programs.title" defaultText="Choose a Track" as="span" className="inline" />}
            className="mb-10"
          />
          <p className="font-body text-pretty text-sm text-charcoal/70 max-w-2xl mb-12">
            <StudioText
              k="programs.intro"
              defaultText="Every track has its own tempo, age grouping, and coaching rhythm. The overview below is meant to make that structure easy to understand before a family starts registration."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </StudioBlock>

        <MotionSection className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PROGRAM_ORDER.map((program, index) => (
            <MotionDiv key={program.slug} className="h-full" delay={index * 0.04}>
              <Link href={program.detailPath}>
                <PremiumCard className="group h-full overflow-hidden border border-charcoal/10 bg-white p-0 shadow-sm transition-shadow duration-200 hover:shadow-[0_30px_80px_rgba(26,26,26,0.10)]">
                  <ProgramVisual slug={program.slug} variant="card" />

                  <div className="space-y-5 p-6 md:p-8">
                    <div className="space-y-2">
                      <p className="font-body text-pretty text-sm leading-relaxed text-charcoal/70">
                        {program.shortPitch}
                      </p>
                      <p className="font-body text-pretty text-sm leading-relaxed text-charcoal/60">
                        {program.heroLead}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {program.highlights.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-charcoal/10 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-charcoal/60"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-charcoal/10 pt-5">
                      <div className="text-[10px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1} · {program.scheduleBlurb}
                      </div>
                      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                        View details →
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </Link>
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
            <Link href="/register">Start Registration</Link>
          </ClayButton>
        </div>
      </main>
    </MotionPage>
  );
};

export default Programs;
