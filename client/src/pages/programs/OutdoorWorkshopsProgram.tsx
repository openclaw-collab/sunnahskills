
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { StatusDot } from "@/components/brand/StatusDot";
import { PROGRAMS } from "@/lib/programConfig";

const OutdoorWorkshopsProgram = () => {
  const hero = PROGRAMS.outdoor.heroImage;
  const workshops = [
    { 
      title: "Basic Survival Skills", 
      age: "8-15 years", 
      duration: "Full Day",
      skills: "Fire making, shelter building, navigation, and knot tying fundamentals"
    },
    { 
      title: "Advanced Fire Making", 
      age: "10-16 years", 
      duration: "Half Day",
      skills: "In-depth fire making techniques, different materials and methods"
    },
    { 
      title: "Shelter Building Mastery", 
      age: "8-15 years", 
      duration: "Half Day",
      skills: "Advanced shelter construction for various weather conditions"
    },
    { 
      title: "Navigation & Knot Tying", 
      age: "10-16 years", 
      duration: "Full Day",
      skills: "Advanced navigation techniques and comprehensive knot tying skills"
    },
  ];

  const seasons = [
    { season: "Spring", focus: "Nature awakening, plant identification, hiking" },
    { season: "Summer", focus: "Water activities, camping skills, extended outdoor time" },
    { season: "Fall", focus: "Tracking, foraging basics, weather awareness" },
    { season: "Winter", focus: "Cold weather skills, indoor planning, equipment care" },
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
            <StatusDot ariaLabel="Workshop-based program" />
            Program: Workshop Series
          </p>
          <h1 className="font-heading text-5xl md:text-7xl tracking-tight text-cream leading-none">
            Outdoor Workshops
          </h1>
          <p className="mt-8 text-cream/70 font-body text-sm md:text-base max-w-2xl leading-relaxed">
            Connecting young Muslims with Allah’s creation through hands-on outdoor education, survival skills, and
            disciplined readiness.
          </p>

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
        </div>
      </header>

      {/* OVERVIEW */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <SectionHeader eyebrow="Overview" title="Learning from Allah’s Creation" />
              <p className="font-body text-charcoal/70 leading-relaxed">
                Our outdoor workshops combine practical wilderness skills with Islamic values of environmental
                stewardship and appreciation for Allah’s creation. Students learn essential outdoor skills while
                developing a deeper connection to the natural world.
              </p>
              <p className="font-body text-charcoal/70 leading-relaxed">
                From basic survival techniques to advanced outdoor leadership, our programs build confidence,
                self-reliance, and respect for nature—grounded in the Islamic principle of being responsible stewards
                of the Earth.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <TelemetryCard title="Preparedness" label="pillar">
                  Safety-first systems and calm decision making.
                </TelemetryCard>
                <TelemetryCard title="Stewardship" label="ethos">
                  Respect for land, tools, and community.
                </TelemetryCard>
              </div>
            </div>

            <DarkCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <StatusDot ariaLabel="Field notes" />
                  <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                    Field Notes
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-cream/10 bg-charcoal/40 p-6 text-cream/80 text-sm leading-relaxed">
                Workshops are scheduled by date. Registration includes gear/readiness acknowledgements and a clear
                checklist so families know exactly what to bring.
              </div>
            </DarkCard>
          </div>
        </div>
      </section>

      {/* WORKSHOPS */}
      <section className="py-20 bg-white border-y border-charcoal/5">
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
            {workshops.map((w) => (
              <PremiumCard key={w.title} className="bg-white border border-charcoal/10">
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
            ))}
          </div>
        </div>
      </section>

      {/* SEASONS */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Seasonality" title="Year-Round Learning" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasons.map((s) => (
              <TelemetryCard key={s.season} title={s.season} label="season">
                {s.focus}
              </TelemetryCard>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY / PREP */}
      <section className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Readiness" title="Safety & Preparation" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                What to Bring
              </div>
              <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                <li>• Weather-appropriate clothing</li>
                <li>• Sturdy outdoor shoes/boots</li>
                <li>• Water bottle and healthy snacks</li>
                <li>• Sun protection (hat, sunscreen)</li>
              </ul>
            </PremiumCard>
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
                  Pick a date. Confirm readiness. Complete enrollment.
                </h2>
                <p className="mt-4 font-body text-charcoal/70 max-w-2xl">
                  Registration is workshop-based: select a specific workshop/date, acknowledge gear requirements, then
                  pay once—in the same flow.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
        </div>
      </section>
    </div>
  );
};

export default OutdoorWorkshopsProgram;
