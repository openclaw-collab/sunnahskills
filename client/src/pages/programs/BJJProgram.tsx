
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { StatusDot } from "@/components/brand/StatusDot";
import { PROGRAMS } from "@/lib/programConfig";

const BJJProgram = () => {
  const hero = PROGRAMS.bjj.heroImage;
  const ageGroups = [
    {
      group: "Women & Girls (Youth)",
      age: "5-11 years",
      time: "45 minutes",
      focus: "Basic movements, fundamental techniques, confidence building",
    },
    {
      group: "Women & Girls (Teen+)",
      age: "12+ years",
      time: "60 minutes",
      focus: "Advanced techniques, self-defense, leadership development",
    },
    {
      group: "Boys (Youth)",
      age: "8-13 years",
      time: "45 minutes",
      focus: "Fundamental grappling, respect, teamwork",
    },
    {
      group: "Boys (Teen+)",
      age: "14+ years",
      time: "60 minutes",
      focus: "Advanced techniques, competition preparation, mentorship",
    },
    {
      group: "Little Kids Program",
      age: "Coming Soon",
      time: "30 minutes",
      focus: "Basic movements, following instructions, fun introduction to martial arts",
    },
  ];

  return (
    <div className="bg-cream min-h-screen">
      <div className="noise-overlay" />

      {/* HERO */}
      <header className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={hero.src}
            alt={hero.alt}
            className="w-full h-full object-cover grayscale brightness-75 contrast-125 opacity-80"
            style={{ objectPosition: hero.objectPosition }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-charcoal" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-20">
          <p className="text-clay font-mono-label text-xs uppercase tracking-[0.18em] mb-6 flex items-center gap-2">
            <StatusDot ariaLabel="Enrollment Open" />
            Program: Active
          </p>
          <h1 className="font-heading text-5xl md:text-7xl tracking-tight text-cream leading-none">
            Brazilian Jiu-Jitsu
          </h1>
          <p className="mt-8 text-cream/70 font-body text-sm md:text-base max-w-2xl leading-relaxed">
            The gentle art that builds character, confidence, and unshakeable mental toughness through Islamic
            principles.
          </p>

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
        </div>
      </header>

      {/* OVERVIEW */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <SectionHeader eyebrow="Overview" title="The Gentle Art" />
              <p className="font-body text-charcoal/70 leading-relaxed">
                Brazilian Jiu-Jitsu is more than just a martial art—it&apos;s a tool for developing the complete person.
                Through the practice of grappling, leverage, and technique over strength, students learn valuable life
                lessons about perseverance, problem-solving, and maintaining composure under pressure.
              </p>
              <p className="font-body text-charcoal/70 leading-relaxed">
                Our program integrates Islamic values of respect, discipline, and community while teaching practical
                self-defense skills that build confidence and character in young Muslims.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <TelemetryCard title="Technique First" label="principle">
                  Leverage over strength. Calm under pressure.
                </TelemetryCard>
                <TelemetryCard title="Character Built In" label="ethos">
                  Respect, discipline, and community accountability.
                </TelemetryCard>
              </div>
            </div>

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
                    <div className="mt-1">Recurring enrollment</div>
                  </div>
                </div>
              </div>
            </DarkCard>
          </div>
        </div>
      </section>

      {/* AGE GROUPS */}
      <section className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <SectionHeader eyebrow="Tracks" title="Age-Appropriate Programs" />
            <Link href="/programs/bjj/register">
              <ClayButton className="text-[11px] uppercase tracking-[0.18em] px-6 py-3">
                Start Registration
              </ClayButton>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {ageGroups.map((group) => (
              <PremiumCard key={group.group} className="bg-white border border-charcoal/10">
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
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <PremiumCard className="bg-cream">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss">
                  Next step
                </div>
                <h2 className="mt-2 font-heading text-3xl md:text-4xl tracking-tight text-charcoal">
                  Begin the training with a guided registration.
                </h2>
                <p className="mt-4 font-body text-charcoal/70 max-w-2xl">
                  Complete a structured enrollment flow, select the right session, sign waivers, and handle payment
                  in-app.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
        </div>
      </section>
    </div>
  );
};

export default BJJProgram;
