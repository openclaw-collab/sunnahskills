import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { StatusDot } from "@/components/brand/StatusDot";
import { ProgramPageHeroMedia } from "@/components/programs/ProgramPageHeroMedia";
import { MotionDiv, MotionPage, MotionSection } from "@/components/motion/PageMotion";
import { PROGRAMS, getProgramTypeLabel } from "@/lib/programConfig";

const BJJProgram = () => {
  const program = PROGRAMS.bjj;
  const ageGroups = [
    {
      group: "Youth Foundations",
      age: "6-9 years",
      time: "45 minutes",
      focus: "Basic movements, listening skills, and confidence through structure",
    },
    {
      group: "Youth Development",
      age: "10-13 years",
      time: "45 minutes",
      focus: "Fundamental grappling, pressure awareness, and steady technical growth",
    },
    {
      group: "Teen Leadership",
      age: "14-17 years",
      time: "60 minutes",
      focus: "Advanced techniques, composure under pressure, and mentorship",
    },
    {
      group: "Competition Prep",
      age: "14+ years",
      time: "60 minutes",
      focus: "Positional sparring, refined transitions, and controlled pace",
    },
    {
      group: "Little Kids Program",
      age: "Coming Soon",
      time: "30 minutes",
      focus: "Basic movement, simple games, and a friendly introduction to the mat",
    },
  ];

  return (
    <MotionPage className="bg-cream min-h-screen">
      <div className="noise-overlay" />

      <header className="relative min-h-[420px] overflow-hidden bg-charcoal text-cream md:min-h-[480px]">
        <div className="absolute inset-0">
          <ProgramPageHeroMedia program={program} />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-28 md:pb-20 md:pt-36">
          <div className="max-w-3xl">
            <MotionDiv delay={0.04}>
              <p className="text-clay font-mono-label text-xs uppercase tracking-[0.18em] mb-6 flex items-center gap-2">
                <StatusDot ariaLabel="Enrollment Open" />
                {getProgramTypeLabel(program.type)}
              </p>
              <h1 className="font-heading text-5xl md:text-7xl tracking-tight text-cream leading-none text-balance">
                {program.name}
              </h1>
              <p className="mt-8 text-cream/75 font-body text-sm md:text-base max-w-2xl leading-relaxed text-pretty">
                {program.heroLead}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {program.highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/80"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Link href="/programs/bjj/register">
                  <ClayButton className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                    Register Now
                  </ClayButton>
                </Link>
                <Link href="/schedule">
                  <OutlineButton className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em] border-cream/20 text-cream hover:bg-cream/10">
                    View Schedule
                  </OutlineButton>
                </Link>
              </div>
            </MotionDiv>
          </div>
        </div>
      </header>

      <MotionSection className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <MotionDiv delay={0.04} className="space-y-6">
              <SectionHeader eyebrow="Overview" title="Technique Over Strength" />
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                {program.shortPitch} Students learn to stay calm, move with purpose, and solve problems one position
                at a time.
              </p>
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                The program is organized by age and experience so each student can train in the right room, at the
                right pace, with coaching that reinforces respect, patience, and consistent effort.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <MotionDiv delay={0.04}>
                  <TelemetryCard title="Leverage First" label="principle">
                    Control positions without relying on size or force.
                  </TelemetryCard>
                </MotionDiv>
                <MotionDiv delay={0.08}>
                  <TelemetryCard title="Character Built In" label="ethos">
                    Composure, discipline, and accountability on the mat.
                  </TelemetryCard>
                </MotionDiv>
              </div>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <DarkCard>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <StatusDot ariaLabel="Training Block" />
                    <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                      Training Block
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-moss/25 bg-charcoal/40 p-6 text-cream/80">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-cream/50">
                        Focus
                      </div>
                      <div className="mt-1">Safety • Fundamentals • Confidence</div>
                    </div>
                    <div>
                      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-cream/50">
                        Model
                      </div>
                      <div className="mt-1">{getProgramTypeLabel(program.type)}</div>
                    </div>
                  </div>
                </div>
              </DarkCard>
            </MotionDiv>
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <SectionHeader eyebrow="Tracks" title="Age-Appropriate Progression" />
            <Link href="/programs/bjj/register">
              <ClayButton className="text-[11px] uppercase tracking-[0.18em] px-6 py-3">
                Start Registration
              </ClayButton>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {ageGroups.map((group, index) => (
              <MotionDiv key={group.group} delay={index * 0.04}>
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                        {group.age}
                      </div>
                      <div className="mt-1 font-heading text-xl text-charcoal">{group.group}</div>
                    </div>
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                      {group.time}
                    </div>
                  </div>
                  <p className="mt-4 font-body text-sm text-charcoal/70 leading-relaxed">{group.focus}</p>
                </PremiumCard>
              </MotionDiv>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <MotionDiv delay={0.04}>
            <PremiumCard className="bg-cream">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss">
                    Next step
                  </div>
                  <h2 className="mt-2 font-heading text-3xl md:text-4xl tracking-tight text-charcoal">
                    Begin the training with a guided registration.
                  </h2>
                  <p className="mt-4 font-body text-charcoal/70 max-w-2xl text-pretty">
                    Complete a structured enrollment flow, choose the right session, sign waivers, and handle payment
                    in-app.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto sm:flex-row">
                  <Link href="/programs/bjj/register">
                    <ClayButton className="w-full md:w-auto px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                      Register Now
                    </ClayButton>
                  </Link>
                  <Link href="/contact">
                    <OutlineButton className="w-full md:w-auto px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                      Contact Us
                    </OutlineButton>
                  </Link>
                </div>
              </div>
            </PremiumCard>
          </MotionDiv>
        </div>
      </MotionSection>
    </MotionPage>
  );
};

export default BJJProgram;
