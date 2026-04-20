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
  const price = "$125";
  const sessions = [
    {
      time: "10:00 AM – 12:00 PM",
      skillLevel: "Public May Series",
      equipment: "All bows, arrows, targets, and safety equipment included",
      focus: "Four-Sunday morning slot with safety lesson, stance work, and form coaching",
    },
    {
      time: "1:00 PM – 3:00 PM",
      skillLevel: "Public May Series",
      equipment: "All bows, arrows, targets, and safety equipment included",
      focus: "Four-Sunday afternoon slot with individualized coaching and constructive feedback",
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
              <p className="mt-4 text-cream/65 font-body text-sm max-w-2xl leading-relaxed text-pretty">
                Public May series at E.T. Seaton Park range on May 10, 17, 24, and 31.
                Two time slots, all equipment provided, a mandatory intro lesson for first-timers, and one account checkout.
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
                {program.shortPitch} Small groups with individualized coaching on stance, anchor, and release.
              </p>
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                Seaton Archery Range is located behind the Ontario Science Centre. Students receive clear safety instruction,
                individualized feedback on form, and repeated practice in stance, anchor, and release.
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
                  <div className="rounded-2xl border border-clay/25 bg-clay/10 p-4 text-cream">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">Tuition</div>
                    <div className="mt-2 font-heading text-3xl">{price}</div>
                    <div className="mt-1 text-xs text-cream/70">Four-session series · paid in the normal account checkout</div>
                  </div>
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
                  <li>• Mandatory 30-minute safety and intro lesson for first-timers</li>
                  <li>• Professional supervision at every session</li>
                  <li>• Clear range rules and regular equipment inspection</li>
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
                  <li>• Mental focus, concentration, and discipline</li>
                  <li>• Constructive feedback throughout the session</li>
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
                    Sign in to your Family & Member Account, choose the participant, answer the archery form, and add it to the same registration cart.
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
