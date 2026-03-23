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

const BullyproofingProgram = () => {
  const program = PROGRAMS.bullyproofing;
  const modules = [
    {
      title: "Verbal Defense Skills",
      duration: "1 session",
      age: "8-14 years",
      content: "Learning to set clear boundaries, de-escalate, and speak with confidence",
    },
    {
      title: "Situational Awareness",
      duration: "1 session",
      age: "8-14 years",
      content: "Recognizing risk, trusting instincts, and making smart decisions early",
    },
    {
      title: "Physical Protection",
      duration: "1 session",
      age: "8-14 years",
      content: "Basic grappling for distance control, escape, and personal safety",
    },
    {
      title: "Confidence Building",
      duration: "1 session",
      age: "8-14 years",
      content: "Building self-confidence through practical drills and consistent coaching",
    },
  ];

  const scenarios = [
    "Verbal bullying and name-calling",
    "Social exclusion and peer pressure",
    "Physical intimidation and threats",
    "Online harassment and cyberbullying",
    "Stranger danger situations",
    "Inappropriate touching or contact",
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
                <StatusDot ariaLabel="Workshop series" />
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
                <Link href="/programs/bullyproofing/register">
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
              <SectionHeader eyebrow="Overview" title="Confidence Without Aggression" />
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                {program.shortPitch} The workshops are practical, calm, and age-appropriate, with clear language that
                helps students respond without escalating.
              </p>
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                Families can use the parent notes field in registration to share context so instructors can better
                support the student before the series begins.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <MotionDiv delay={0.04}>
                  <TelemetryCard title="Boundaries" label="module">
                    Verbal skill, posture, and calm escalation control.
                  </TelemetryCard>
                </MotionDiv>
                <MotionDiv delay={0.08}>
                  <TelemetryCard title="Awareness" label="module">
                    Threat recognition and decision-making drills.
                  </TelemetryCard>
                </MotionDiv>
              </div>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <DarkCard>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <StatusDot ariaLabel="Coverage" />
                    <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                      Coverage
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {scenarios.slice(0, 4).map((s, index) => (
                    <MotionDiv key={s} delay={index * 0.04}>
                      <div className="rounded-2xl border border-cream/10 bg-charcoal/40 p-4 text-xs text-cream/75">
                        {s}
                      </div>
                    </MotionDiv>
                  ))}
                </div>
                <div className="mt-4 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/50">
                  Plus: stranger danger, inappropriate contact awareness.
                </div>
              </DarkCard>
            </MotionDiv>
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <SectionHeader eyebrow="Series" title="Comprehensive Skills Training" />
            <Link href="/programs/bullyproofing/register">
              <ClayButton className="text-[11px] uppercase tracking-[0.18em] px-6 py-3">
                Enroll in Series
              </ClayButton>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((m, index) => (
              <MotionDiv key={m.title} delay={index * 0.04}>
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-heading text-xl text-charcoal">{m.title}</div>
                      <div className="mt-2 font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                        Ages {m.age} · {m.duration}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 font-body text-sm text-charcoal/70 leading-relaxed">{m.content}</p>
                </PremiumCard>
              </MotionDiv>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Foundation" title="Values Behind the Practice" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <MotionDiv delay={0.04}>
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Character Development
                </div>
                <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                  <li>• Courage (Shaja&apos;ah) in the face of injustice</li>
                  <li>• Patience (Sabr) and emotional control</li>
                  <li>• Justice (Adl) and standing up for others</li>
                  <li>• Wisdom (Hikmah) in choosing responses</li>
                </ul>
              </PremiumCard>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Practical Skills
                </div>
                <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                  <li>• Clear verbal boundary setting</li>
                  <li>• De-escalation and conflict resolution</li>
                  <li>• Basic self-defense and escape techniques</li>
                  <li>• When and how to seek help</li>
                </ul>
              </PremiumCard>
            </MotionDiv>
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20 bg-white border-t border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <MotionDiv delay={0.04}>
            <PremiumCard className="bg-cream">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss">
                    Next step
                  </div>
                  <h2 className="mt-2 font-heading text-3xl md:text-4xl tracking-tight text-charcoal">
                    Share concerns. Choose the right series. Enroll.
                  </h2>
                  <p className="mt-4 font-body text-charcoal/70 max-w-2xl text-pretty">
                    The registration flow includes parent notes and student context so instructors can meet the student
                    with care.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto sm:flex-row">
                  <Link href="/programs/bullyproofing/register">
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

export default BullyproofingProgram;
