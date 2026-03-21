import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { StatusDot } from "@/components/brand/StatusDot";
import { ProgramVisual } from "@/components/programs/ProgramVisual";
import { MotionDiv, MotionPage, MotionSection } from "@/components/motion/PageMotion";
import { PROGRAMS, getProgramTypeLabel } from "@/lib/programConfig";

const OutdoorWorkshopsProgram = () => {
  const program = PROGRAMS.outdoor;
  const workshops = [
    {
      title: "Basic Survival Skills",
      age: "8-15 years",
      duration: "Full Day",
      skills: "Fire making, shelter building, navigation, and knot tying fundamentals",
    },
    {
      title: "Advanced Fire Making",
      age: "10-16 years",
      duration: "Half Day",
      skills: "In-depth fire making techniques, materials, and safe ignition methods",
    },
    {
      title: "Shelter Building Mastery",
      age: "8-15 years",
      duration: "Half Day",
      skills: "Advanced shelter construction for changing weather conditions",
    },
    {
      title: "Navigation & Knot Tying",
      age: "10-16 years",
      duration: "Full Day",
      skills: "Navigation practice and a practical knot tying toolkit",
    },
  ];

  const seasons = [
    { season: "Spring", focus: "Nature awakening, plant identification, and hiking" },
    { season: "Summer", focus: "Water safety, camping skills, and extended outdoor time" },
    { season: "Fall", focus: "Tracking, foraging basics, and weather awareness" },
    { season: "Winter", focus: "Cold weather skills, planning, and equipment care" },
  ];

  return (
    <MotionPage className="bg-cream min-h-screen">
      <div className="noise-overlay" />

      <header className="relative overflow-hidden bg-charcoal text-cream">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-charcoal/86" />
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-moss/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-64 w-64 rounded-full bg-clay/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <MotionDiv className="max-w-2xl" delay={0.04}>
              <p className="text-clay font-mono-label text-xs uppercase tracking-[0.18em] mb-6 flex items-center gap-2">
                <StatusDot ariaLabel="Workshop-based program" />
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
                <Link href="/programs/outdoor/register">
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

            <MotionDiv className="lg:justify-self-end" delay={0.08}>
              <ProgramVisual slug="outdoor" variant="hero" className="shadow-2xl shadow-black/30" />
            </MotionDiv>
          </div>
        </div>
      </header>

      <MotionSection className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <MotionDiv delay={0.04} className="space-y-6">
              <SectionHeader eyebrow="Overview" title="Readiness Through Stewardship" />
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                {program.shortPitch} The emphasis is on practical skill, calm decision making, and respect for the
                land, the tools, and the people you are learning alongside.
              </p>
              <p className="font-body text-pretty text-charcoal/70 leading-relaxed">
                Students leave each workshop with a clear checklist of what they practiced, what they learned, and how
                to keep building the same skills at home or in the field.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <MotionDiv delay={0.04}>
                  <TelemetryCard title="Preparedness" label="pillar">
                    Safety-first systems and calm decision making.
                  </TelemetryCard>
                </MotionDiv>
                <MotionDiv delay={0.08}>
                  <TelemetryCard title="Stewardship" label="ethos">
                    Respect for land, tools, and community.
                  </TelemetryCard>
                </MotionDiv>
              </div>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <DarkCard>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <StatusDot ariaLabel="Field notes" />
                    <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                      Field Notes
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-cream/10 bg-charcoal/40 p-6 text-sm leading-relaxed text-cream/80">
                  Workshops are scheduled by date. Registration includes gear and readiness acknowledgements so families
                  know exactly what to bring.
                </div>
              </DarkCard>
            </MotionDiv>
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <SectionHeader eyebrow="Workshops" title="Hands-On Learning Blocks" />
            <Link href="/programs/outdoor/register">
              <ClayButton className="text-[11px] uppercase tracking-[0.18em] px-6 py-3">
                Choose a Workshop
              </ClayButton>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {workshops.map((w, index) => (
              <MotionDiv key={w.title} delay={index * 0.04}>
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-heading text-xl text-charcoal">{w.title}</div>
                      <div className="mt-2 font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                        Ages {w.age} · {w.duration}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 font-body text-sm text-charcoal/70 leading-relaxed">{w.skills}</p>
                </PremiumCard>
              </MotionDiv>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Seasonality" title="Year-Round Learning" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasons.map((s, index) => (
              <MotionDiv key={s.season} delay={index * 0.04}>
                <TelemetryCard title={s.season} label="season">
                  {s.focus}
                </TelemetryCard>
              </MotionDiv>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Readiness" title="Safety and Preparation" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <MotionDiv delay={0.04}>
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Safety &amp; Equipment
                </div>
                <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                  <li>• Certified outdoor education instructors</li>
                  <li>• First aid and emergency protocols</li>
                  <li>• Weather monitoring and backup plans</li>
                  <li>• Small instructor-to-student ratios</li>
                </ul>
              </PremiumCard>
            </MotionDiv>

            <MotionDiv delay={0.08}>
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  What to Bring
                </div>
                <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                  <li>• Weather-appropriate clothing</li>
                  <li>• Sturdy outdoor shoes or boots</li>
                  <li>• Water bottle and healthy snacks</li>
                  <li>• Sun protection: hat and sunscreen</li>
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
                    Pick a date. Confirm readiness. Complete enrollment.
                  </h2>
                  <p className="mt-4 font-body text-charcoal/70 max-w-2xl text-pretty">
                    Registration is workshop-based: select a specific date, acknowledge gear requirements, then pay once
                    in the same flow.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto sm:flex-row">
                  <Link href="/programs/outdoor/register">
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

export default OutdoorWorkshopsProgram;
