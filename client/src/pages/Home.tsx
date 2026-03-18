import { useEffect } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ClayButton } from "@/components/brand/ClayButton";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { DarkCard } from "@/components/brand/DarkCard";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StatusDot } from "@/components/brand/StatusDot";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  useEffect(() => {
    gsap.fromTo(
      ".hero-anim",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.2 },
    );

    gsap.utils.toArray<HTMLElement>(".protocol-card").forEach((card, index, cards) => {
      if (index === 0) return;
      const prev = cards[index - 1].querySelector(".protocol-content");
      if (!prev) return;
      gsap.to(prev, {
        scale: 0.9,
        filter: "blur(10px)",
        opacity: 0.5,
        scrollTrigger: {
          trigger: card,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });
    });
  }, []);

  return (
    <div className="bg-cream text-charcoal">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* HERO */}
      <header className="relative h-[100dvh] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/hero-judo.jpg"
            alt="Judo Throw Training"
            className="w-full h-full object-cover object-[center_20%] grayscale brightness-75 contrast-125 opacity-80"
            data-studio-image-slot="home.hero.bg"
          />
          <div className="absolute inset-0 hero-bg-gradient" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 md:pb-32">
          <StudioBlock id="home.hero" label="Hero" page="Home">
            <div className="max-w-4xl hero-content">
            <p className="hero-anim text-clay font-mono-label text-xs uppercase tracking-[0.18em] mb-6 flex items-center gap-2">
              <StatusDot ariaLabel="System Initialized" />
              <StudioText k="home.hero.eyebrow" defaultText="System Initialized" as="span" className="inline" />
            </p>
            <h1 className="flex flex-col gap-2">
              <span className="hero-anim font-heading text-5xl md:text-7xl lg:text-[6rem] tracking-tight text-cream leading-none">
                <StudioText k="home.hero.titleA" defaultText="Built Through" as="span" className="inline" />
              </span>
              <span className="hero-anim font-serif-accent italic text-6xl md:text-8xl lg:text-[8rem] tracking-tight text-cream leading-none mt-2 pr-4">
                <StudioText k="home.hero.titleB" defaultText="Discipline." as="span" className="inline" />
              </span>
            </h1>
            <p className="hero-anim mt-10 text-cream/70 font-body text-sm md:text-base max-w-lg leading-relaxed">
              <StudioText
                k="home.hero.subcopy"
                defaultText="Train the body. Shape the character. Brazilian Jiu-Jitsu, archery, outdoor skills, and bullyproofing taught through a structured youth development system."
                as="span"
                className="inline"
                multiline
              />
            </p>
            <div className="hero-anim mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <ClayButton className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                  <StudioText k="home.hero.ctaPrimary" defaultText="Register Now" as="span" className="inline" />
                </ClayButton>
              </Link>
              <Link href="/schedule">
                <button className="px-8 py-3.5 rounded-full border border-cream/20 text-cream text-[11px] font-normal uppercase tracking-[0.18em] hover:bg-cream/10 transition-colors">
                  <StudioText k="home.hero.ctaSecondary" defaultText="View Schedule" as="span" className="inline" />
                </button>
              </Link>
            </div>
          </div>
          </StudioBlock>
        </div>
      </header>

      {/* FEATURES / TELEMETRY */}
      <section id="features" className="py-32 bg-cream relative z-20 rounded-t-[3rem] -mt-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="Academy Telemetry" />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <TelemetryCard title="Academy Snapshot" label="Snapshot">
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal/60 uppercase tracking-wide">Active Participants</span>
                  <span className="font-serif-accent text-2xl text-moss">30+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-charcoal/60 uppercase tracking-wide">Age Range</span>
                  <span className="font-serif-accent text-2xl text-moss">6–∞</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-charcoal/60 uppercase tracking-wide">Parent Rating</span>
                  <span className="font-serif-accent text-2xl text-moss">4.9/5</span>
                </div>
              </div>
            </TelemetryCard>

            <DarkCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <StatusDot ariaLabel="Technique Viewer" />
                  <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                    Technique Viewer
                  </span>
                </div>
              </div>
              <div className="relative w-full h-64 bg-charcoal rounded-2xl overflow-hidden border border-moss/20">
                <TechniqueViewer className="w-full h-full" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 font-mono-label text-[9px] text-cream/80 uppercase backdrop-blur-sm bg-charcoal/70 py-1">
                  <span>Base: Locked</span>
                  <span className="text-clay">Posture: 98%</span>
                </div>
              </div>
            </DarkCard>

            <TelemetryCard title="Schedule Preview" label="Schedule">
              <div className="grid grid-cols-7 gap-1.5 mt-2 text-[10px]">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div key={d} className="text-center text-charcoal/40 font-heading">
                    {d}
                  </div>
                ))}
                <div className="aspect-square rounded-md bg-cream border border-moss/5" />
                <div className="aspect-square rounded-md bg-moss/5 border border-moss/10 relative">
                  <StatusDot className="absolute bottom-1 left-1" ariaLabel="BJJ Fundamentals" />
                </div>
                <div className="aspect-square rounded-md bg-cream border border-moss/5" />
                <div className="aspect-square rounded-md bg-moss/5 border border-moss/10 relative">
                  <StatusDot className="absolute bottom-1 left-1" ariaLabel="Archery Skills" />
                </div>
              </div>
              <div className="mt-4 text-[10px] font-body text-charcoal/60 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <StatusDot ariaLabel="BJJ Fundamentals" />
                  BJJ Fundamentals
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot className="bg-moss" ariaLabel="Archery Skills" />
                  Archery Skills
                </div>
              </div>
            </TelemetryCard>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <StudioBlock id="home.philosophy" label="Philosophy" page="Home">
      <section
        id="manifesto"
        className="py-40 bg-charcoal text-cream relative overflow-hidden rounded-[3rem] mx-2 md:mx-6 my-10"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-charcoal/80 mix-blend-multiply" />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <p className="font-mono-label text-sm text-moss mb-12 uppercase tracking-[0.2em]">
            <StudioText k="home.philosophy.label" defaultText="The Philosophy" as="span" className="inline" />
          </p>
          <h3 className="font-body text-xl md:text-3xl text-cream/60 mb-8 font-light tracking-tight">
            <StudioText k="home.philosophy.subheading" defaultText="Most programs keep children busy." as="span" className="inline" />
          </h3>
          <h2 className="font-serif-accent italic text-4xl md:text-6xl lg:text-[5.5rem] tracking-tight leading-[1.1] text-cream mt-4">
            <StudioText k="home.philosophy.heading" defaultText="We build discipline." as="span" className="inline" />
          </h2>
          <p className="mt-10 font-body font-light text-cream/70 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            <StudioText
              k="home.philosophy.body"
              defaultText="Strength without character is incomplete. Character without training is fragile. Sunnah Skills develops confidence, restraint, and capability through serious, structured training."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </div>
      </section>
      </StudioBlock>

      {/* PROGRAMS STICKY STACK */}
      <section id="programs" className="relative bg-cream pb-32">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-10">
          <SectionHeader title="Core Curriculum" />
        </div>

        <div className="protocol-card sticky top-0 h-screen flex items-center justify-center p-6 pt-24">
          <div className="protocol-content w-full max-w-5xl border border-moss/10 rounded-[3rem] h-[80vh] shadow-xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden bg-white">
            <div className="flex-1 z-10">
              <span className="font-mono-label text-xs text-moss uppercase tracking-[0.18em] mb-4 block">
                Discipline 01
              </span>
              <h3 className="font-heading text-4xl tracking-tight text-charcoal mb-6">Brazilian Jiu-Jitsu</h3>
              <p className="text-charcoal/70 font-body text-sm md:text-base max-w-md leading-relaxed mb-6">
                Ground-based grappling that emphasizes technique over strength.
              </p>
              <ul className="text-xs font-mono-label text-charcoal/60 space-y-2 uppercase tracking-wide">
                <li>+ Ages 6-17</li>
                <li>+ Separate boys&apos; &amp; girls&apos; classes</li>
                <li>+ Belt progression system</li>
                <li>+ Character building focus</li>
              </ul>
            </div>
            <div className="flex-1 relative h-full flex items-center justify-center min-h-[300px]">
              <div className="w-64 h-64 border border-moss/15 rounded-full flex items-center justify-center">
                <div className="text-xs font-mono-label text-charcoal/60 uppercase tracking-[0.2em]">
                  BJJ Protocol
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="protocol-card sticky top-0 h-screen flex items-center justify-center p-6 pt-24">
          <div className="protocol-content w-full max-w-5xl bg-moss text-cream border border-charcoal/20 rounded-[3rem] h-[80vh] shadow-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
            <div className="flex-1 z-10">
              <span className="font-mono-label text-xs text-clay uppercase tracking-[0.18em] mb-4 block">
                Discipline 02
              </span>
              <h3 className="font-heading text-4xl tracking-tight text-cream mb-6">Traditional Archery</h3>
              <p className="text-cream/70 font-body text-sm md:text-base max-w-md leading-relaxed mb-6">
                Following the Sunnah of the Prophet ﷺ through focused, disciplined archery practice.
              </p>
              <ul className="text-xs font-mono-label text-cream/60 space-y-2 uppercase tracking-wide">
                <li>+ Summer &amp; fall sessions</li>
                <li>+ Safety training included</li>
                <li>+ Mental focus development</li>
                <li>+ Traditional bows</li>
              </ul>
            </div>
            <div className="flex-1 relative w-full h-full min-h-[300px] bg-charcoal/40 rounded-3xl overflow-hidden flex items-center justify-center border border-cream/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(26,26,26,0.8)_100%)]" />
              <div className="w-40 h-40 border border-cream/30 rounded-full flex items-center justify-center z-10">
                <span className="font-mono-label text-[10px] text-clay uppercase tracking-[0.18em]">
                  Target Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="protocol-card sticky top-0 h-screen flex items-center justify-center p-6 pt-24">
          <div className="protocol-content w-full max-w-5xl bg-charcoal text-cream border border-moss/20 rounded-[3rem] h-[80vh] shadow-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
            <div className="flex-1 z-10">
              <span className="font-mono-label text-xs text-moss uppercase tracking-[0.18em] mb-4 block">
                Discipline 03
              </span>
              <h3 className="font-heading text-4xl tracking-tight text-cream mb-6">Outdoor Workshops</h3>
              <p className="text-cream/70 font-body text-sm md:text-base max-w-md leading-relaxed mb-6">
                Wilderness skills and environmental connection anchored in responsibility and gratitude.
              </p>
              <ul className="text-xs font-mono-label text-cream/60 space-y-2 uppercase tracking-wide">
                <li>+ Fire building</li>
                <li>+ Shelter construction</li>
                <li>+ Navigation skills</li>
                <li>+ Environmental awareness</li>
              </ul>
            </div>
            <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-[300px]">
              <svg viewBox="0 0 200 200" className="w-full h-full opacity-30 text-moss">
                <path
                  d="M20 100 Q 60 50, 100 100 T 180 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10 120 Q 50 70, 90 120 T 190 120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M30 80 Q 70 30, 110 80 T 170 80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M 0 100 L 200 100"
                  fill="none"
                  stroke="#CC5833"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                />
                <circle cx="100" cy="100" r="3" fill="#CC5833" />
              </svg>
            </div>
          </div>
        </div>

        <div className="protocol-card sticky top-0 h-screen flex items-center justify-center p-6 pt-24">
          <div className="protocol-content w-full max-w-5xl bg-clay text-cream border border-charcoal/20 rounded-[3rem] h-[80vh] shadow-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
            <div className="flex-1 z-10">
              <span className="font-mono-label text-xs text-charcoal/60 uppercase tracking-[0.18em] mb-4 block">
                Discipline 04
              </span>
              <h3 className="font-heading text-4xl tracking-tight text-cream mb-6">Bullyproofing</h3>
              <p className="text-cream/90 font-body text-sm md:text-base max-w-md leading-relaxed mb-6">
                Confidence and self-protection skills to navigate school, social settings, and beyond.
              </p>
              <ul className="text-xs font-mono-label text-charcoal/70 space-y-2 uppercase tracking-wide">
                <li>+ Verbal assertiveness</li>
                <li>+ Situational awareness</li>
                <li>+ Basic grappling</li>
                <li>+ Confidence building</li>
              </ul>
            </div>
            <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-[300px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-2 border-cream/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="absolute w-48 h-48 rounded-full border border-cream/10 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
              </div>
              <div className="relative z-10 px-6 py-3 rounded-full border border-cream/30 bg-charcoal/30 font-mono-label text-[10px] uppercase tracking-[0.2em]">
                Protection Radius
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENROLLMENT TRACKS */}
      <section id="enrollment" className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <SectionHeader title="Enrollment Tracks" />
            <p className="mt-4 text-charcoal/60 font-body text-sm">
              Select the appropriate development stage for your child.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <PremiumCard>
              <span className="font-mono-label text-xs text-charcoal/50 uppercase tracking-[0.18em] mb-2 block">
                Ages 6–9
              </span>
              <h4 className="font-heading text-2xl text-charcoal mb-2">Foundations</h4>
              <p className="text-xs font-body text-charcoal/60 mb-8 border-b border-charcoal/10 pb-6 w-full">
                Focus, basic coordination, and introduction to discipline.
              </p>
            </PremiumCard>
            <PremiumCard>
              <span className="font-mono-label text-xs text-charcoal/50 uppercase tracking-[0.18em] mb-2 block">
                Ages 10–13
              </span>
              <h4 className="font-heading text-2xl text-charcoal mb-2">Development</h4>
              <p className="text-xs font-body text-charcoal/60 mb-8 border-b border-charcoal/10 pb-6 w-full">
                Technical growth, active pressure testing, and real-world application.
              </p>
            </PremiumCard>
            <PremiumCard>
              <span className="font-mono-label text-xs text-charcoal/50 uppercase tracking-[0.18em] mb-2 block">
                Ages 14–17
              </span>
              <h4 className="font-heading text-2xl text-charcoal mb-2">Leadership</h4>
              <p className="text-xs font-body text-charcoal/60 mb-8 border-b border-charcoal/10 pb-6 w-full">
                Advanced capability, outdoor reliance, and guiding younger peers.
              </p>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <StudioBlock id="home.testimonials" label="Testimonials" page="Home">
      <section className="py-24 bg-white border-t border-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 flex flex-col items-center text-center gap-4">
            <h3 className="font-heading text-3xl md:text-5xl text-charcoal tracking-tight">
              <StudioText k="home.testimonials.heading" defaultText="What Parents Say" as="span" className="inline" />
            </h3>
            <p className="font-body text-sm md:text-base text-charcoal/60">
              <StudioText k="home.testimonials.subheading" defaultText="Hear from families who have experienced the Sunnah Skills difference." as="span" className="inline" multiline />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  '“My daughter has gained so much confidence since joining Sunnah Skills. The coaches truly care about character development.”',
                name: "Aisha's Mom",
              },
              {
                quote:
                  "“The BJJ program has taught my son discipline and respect. He's learned that true strength comes from technique, not just power.”",
                name: "Ahmed's Dad",
              },
              {
                quote:
                  "“The archery program is incredible. Our daughter loves learning this traditional skill and the focus it requires.”",
                name: "Fatima's Parents",
              },
            ].map((item) => (
              <PremiumCard key={item.name} className="bg-white border border-charcoal/10 shadow-sm h-full">
                <div className="flex gap-1 items-center mb-3 text-yellow-400 text-lg">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i}>{s}</span>
                  ))}
                </div>
                <div className="text-4xl leading-none text-clay font-serif-accent h-4 -mb-2">“</div>
                <p className="font-body text-charcoal/70 italic text-sm leading-relaxed mt-4">{item.quote}</p>
                <div className="mt-6 flex items-center gap-2 pt-4">
                  <span className="w-8 h-8 rounded-full bg-charcoal/5" />
                  <span className="text-sm font-heading text-charcoal leading-none">{item.name}</span>
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>
      </StudioBlock>
    </div>
  );
};

export default Home;
