
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { StatusDot } from "@/components/brand/StatusDot";
import { PROGRAMS } from "@/lib/programConfig";

const ArcheryProgram = () => {
  const hero = PROGRAMS.archery.heroImage;
  const sessions = [
    { 
      time: "10:00 AM Session", 
      skillLevel: "All Skill Groups", 
      equipment: "Same equipment for all",
      focus: "Individualized training based on skill level"
    },
    { 
      time: "12:30 PM Session", 
      skillLevel: "All Skill Groups", 
      equipment: "Same equipment for all",
      focus: "Individualized training based on skill level"
    },
    { 
      time: "3:00 PM Session", 
      skillLevel: "All Skill Groups", 
      equipment: "Same equipment for all",
      focus: "Individualized training based on skill level"
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
            <StatusDot ariaLabel="Seasonal program" />
            Program: Seasonal
          </p>
          <h1 className="font-heading text-5xl md:text-7xl tracking-tight text-cream leading-none">
            Traditional Archery
          </h1>
          <p className="mt-8 text-cream/70 font-body text-sm md:text-base max-w-2xl leading-relaxed">
            Following the Sunnah of the Prophet ﷺ, developing focus, precision, and character through the noble art of
            archery.
          </p>

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
        </div>
      </header>

      {/* OVERVIEW */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <SectionHeader eyebrow="Overview" title="The Prophet’s Sport" />
              <p className="font-body text-charcoal/70 leading-relaxed">
                Archery holds a special place in Islamic tradition. The Prophet Muhammad ﷺ encouraged archery as both a
                practical skill and a means of developing discipline and focus. Our program honors this tradition while
                teaching modern safety practices and competitive techniques.
              </p>
              <p className="font-body text-charcoal/70 leading-relaxed">
                Students learn not just to hit targets, but to develop the mental clarity, patience, and steady hand
                that archery requires—skills that transfer to academics, emotional regulation, and spiritual growth.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <TelemetryCard title="Focus Training" label="benefit">
                  Breath, posture, and attention under controlled pressure.
                </TelemetryCard>
                <TelemetryCard title="Safety First" label="standard">
                  Clear range rules, supervision, and equipment checks.
                </TelemetryCard>
              </div>
            </div>

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
                {sessions.map((s) => (
                  <div
                    key={s.time}
                    className="rounded-2xl border border-cream/10 bg-charcoal/40 p-4 text-cream/80"
                  >
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
                ))}
              </div>
            </DarkCard>
          </div>
        </div>
      </section>

      {/* SAFETY / SKILLS */}
      <section className="py-20 bg-white border-y border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Standards" title="Safety First Approach" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                Equipment &amp; Safety
              </div>
              <ul className="mt-4 space-y-2 text-sm text-charcoal/70 font-body">
                <li>• Age-appropriate bows and safety equipment provided</li>
                <li>• Professional safety supervision at all times</li>
                <li>• Clear safety protocols and range rules</li>
                <li>• Regular equipment inspection and maintenance</li>
              </ul>
            </PremiumCard>

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
                  Register for the next available session.
                </h2>
                <p className="mt-4 font-body text-charcoal/70 max-w-2xl">
                  Select a session window, acknowledge equipment and safety standards, then complete payment in-app.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
        </div>
      </section>
    </div>
  );
};

export default ArcheryProgram;
