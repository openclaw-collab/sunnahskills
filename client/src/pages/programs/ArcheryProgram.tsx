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

const ArcheryProgram = () => {
  const program = PROGRAMS.archery;
  const sessions = [
    {
      time: "10:00 AM Session",
      skillLevel: "All Skill Groups",
      equipment: "Shared equipment and safety checks",
      focus: "Individualized coaching built around stance, anchor, and release",
    },
    {
      time: "12:30 PM Session",
      skillLevel: "All Skill Groups",
      equipment: "Shared equipment and safety checks",
      focus: "Breath control, repeatable form, and calm shot selection",
    },
    {
      time: "3:00 PM Session",
      skillLevel: "All Skill Groups",
      equipment: "Shared equipment and safety checks",
      focus: "Precision practice and steady improvement under supervision",
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
                <StatusDot ariaLabel="Seasonal program" />
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
                <Link href="/programs/archery/register">
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
              <SectionHeader eyebrow="Overview" title="Focus, Form, and Patience" />
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                {program.shortPitch} The pace is calm and deliberate so students can build confidence through
                repetition, posture, and attention.
              </p>
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                Every session reinforces safety, etiquette, and a steady training rhythm. Families get a seasonal
                program that feels intentional, grounded, and easy to follow.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <MotionDiv delay={0.04}>
                  <TelemetryCard title="Focus Training" label="benefit">
                    Breath, posture, and attention under controlled pressure.
                  </TelemetryCard>
                </MotionDiv>
                <MotionDiv delay={0.08}>
                  <TelemetryCard title="Safety First" label="standard">
                    Clear range rules, supervision, and equipment checks.
                  </TelemetryCard>
                </MotionDiv>
              </div>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <DarkCard>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <StatusDot ariaLabel="Session window" />
                    <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                      Session Windows
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {sessions.map((s, index) => (
                    <MotionDiv key={s.time} delay={index * 0.04}>
                      <div className="rounded-2xl border border-cream/10 bg-charcoal/40 p-4 text-cream/80">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-heading">{s.time}</div>
                          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
                            {s.skillLevel}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-cream/70">{s.focus}</div>
                        <div className="mt-2 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/50">
                          {s.equipment}
                        </div>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </DarkCard>
            </MotionDiv>
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Standards" title="Safety Comes First" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <MotionDiv delay={0.04}>
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Equipment &amp; Safety
                </div>
                <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                  <li>• Age-appropriate bows and safety equipment provided</li>
                  <li>• Professional supervision at every session</li>
                  <li>• Clear safety protocols and range rules</li>
                  <li>• Regular equipment inspection and maintenance</li>
                </ul>
              </PremiumCard>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Skills Development
                </div>
                <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                  <li>• Proper stance and shooting form</li>
                  <li>• Breathing techniques for accuracy</li>
                  <li>• Mental focus and concentration</li>
                  <li>• Equipment care and maintenance</li>
                </ul>
              </PremiumCard>
            </MotionDiv>
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
                    Register for the next available session.
                  </h2>
                  <p className="mt-4 font-body text-charcoal/70 max-w-2xl text-pretty">
                    Select a session window, acknowledge equipment and safety standards, then complete payment in-app.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto sm:flex-row">
                  <Link href="/programs/archery/register">
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

export default ArcheryProgram;
