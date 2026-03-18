
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { StatusDot } from "@/components/brand/StatusDot";
import { PROGRAMS } from "@/lib/programConfig";

const BullyproofingProgram = () => {
  const hero = PROGRAMS.bullyproofing.heroImage;
  const modules = [
    { 
      title: "Verbal Defense Skills", 
      duration: "1 session", 
      age: "8-14 years",
      content: "Learning to set clear boundaries, de-escalation techniques, and assertive communication"
    },
    { 
      title: "Situational Awareness", 
      duration: "1 session", 
      age: "8-14 years",
      content: "Recognizing dangerous situations, trusting instincts, and making smart decisions"
    },
    { 
      title: "Physical Protection", 
      duration: "1 session", 
      age: "8-14 years",
      content: "Basic grappling for distance control, escape techniques, and personal safety"
    },
    { 
      title: "Confidence Building", 
      duration: "1 session", 
      age: "8-14 years",
      content: "Building unshakeable self-confidence through Islamic principles and practical skills"
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
            <StatusDot ariaLabel="Workshop series" />
            Program: Short Series
          </p>
          <h1 className="font-heading text-5xl md:text-7xl tracking-tight text-cream leading-none">
            Bullyproofing Workshops
          </h1>
          <p className="mt-8 text-cream/70 font-body text-sm md:text-base max-w-2xl leading-relaxed">
            Empowering young Muslims with confidence, awareness, and practical skills to handle challenging situations.
          </p>

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
        </div>
      </header>

      {/* OVERVIEW */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <SectionHeader eyebrow="Overview" title="Building Unshakeable Confidence" />
              <p className="font-body text-charcoal/70 leading-relaxed">
                Our bullyproofing workshops go beyond traditional anti-bullying programs. We empower children with
                practical skills, Islamic confidence principles, and the wisdom to handle difficult situations with
                grace and strength.
              </p>
              <p className="font-body text-charcoal/70 leading-relaxed">
                Drawing from Islamic teachings about courage, justice, and standing up for what’s right, we help
                students develop the mental and physical tools to protect themselves and others while maintaining
                Islamic character and values.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <TelemetryCard title="Boundaries" label="module">
                  Verbal skill, posture, and calm escalation control.
                </TelemetryCard>
                <TelemetryCard title="Awareness" label="module">
                  Threat recognition and decision-making drills.
                </TelemetryCard>
              </div>
            </div>

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
                {scenarios.slice(0, 4).map((s) => (
                  <div
                    key={s}
                    className="rounded-2xl border border-cream/10 bg-charcoal/40 p-4 text-xs text-cream/75"
                  >
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[10px] font-mono-label uppercase tracking-[0.18em] text-cream/50">
                Plus: stranger danger, inappropriate contact awareness.
              </div>
            </DarkCard>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="py-20 bg-white border-y border-charcoal/5">
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
            {modules.map((m) => (
              <PremiumCard key={m.title} className="bg-white border border-charcoal/10">
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
            ))}
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader eyebrow="Foundation" title="Islamic Grounding" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white border-t border-charcoal/5">
        <div className="max-w-6xl mx-auto px-6">
          <PremiumCard className="bg-cream">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss">
                  Next step
                </div>
                <h2 className="mt-2 font-heading text-3xl md:text-4xl tracking-tight text-charcoal">
                  Share concerns. Choose the right series. Enroll.
                </h2>
                <p className="mt-4 font-body text-charcoal/70 max-w-2xl">
                  The registration flow includes a place for parent notes and student context so instructors can meet
                  the student with care.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
        </div>
      </section>
    </div>
  );
};

export default BullyproofingProgram;
