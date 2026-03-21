import { useRef } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ClayButton } from "@/components/brand/ClayButton";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { DarkCard } from "@/components/brand/DarkCard";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StatusDot } from "@/components/brand/StatusDot";
import { ProgramVisual } from "@/components/programs/ProgramVisual";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionPage } from "@/components/motion/PageMotion";
import { PROGRAMS } from "@/lib/programConfig";

const curriculum = [
  {
    id: "bjj",
    number: "Discipline 01",
    title: PROGRAMS.bjj.name,
    body: PROGRAMS.bjj.heroLead,
    bullets: PROGRAMS.bjj.highlights,
    cardClassName: "bg-white border border-moss/10",
    numberClassName: "text-moss",
    titleClassName: "text-charcoal",
    bodyClassName: "text-charcoal/70",
    listClassName: "text-charcoal/60",
    visual: <ProgramVisual slug="bjj" variant="card" />,
  },
  {
    id: "archery",
    number: "Discipline 02",
    title: PROGRAMS.archery.name,
    body: PROGRAMS.archery.heroLead,
    bullets: PROGRAMS.archery.highlights,
    cardClassName: "bg-moss text-cream border border-charcoal/20",
    numberClassName: "text-clay",
    titleClassName: "text-cream",
    bodyClassName: "text-cream/75",
    listClassName: "text-cream/65",
    visual: <ProgramVisual slug="archery" variant="card" />,
  },
  {
    id: "outdoor",
    number: "Discipline 03",
    title: PROGRAMS.outdoor.name,
    body: PROGRAMS.outdoor.heroLead,
    bullets: PROGRAMS.outdoor.highlights,
    cardClassName: "bg-charcoal text-cream border border-moss/20",
    numberClassName: "text-moss",
    titleClassName: "text-cream",
    bodyClassName: "text-cream/70",
    listClassName: "text-cream/60",
    visual: <ProgramVisual slug="outdoor" variant="card" />,
  },
  {
    id: "bullyproofing",
    number: "Discipline 04",
    title: PROGRAMS.bullyproofing.name,
    body: PROGRAMS.bullyproofing.heroLead,
    bullets: PROGRAMS.bullyproofing.highlights,
    cardClassName: "bg-clay text-cream border border-charcoal/20",
    numberClassName: "text-charcoal/60",
    titleClassName: "text-cream",
    bodyClassName: "text-cream/90",
    listClassName: "text-cream/75",
    visual: <ProgramVisual slug="bullyproofing" variant="card" />,
  },
];

const testimonials = [
  {
    quote:
      "My daughter has gained so much confidence since joining Sunnah Skills. The coaches truly care about character development.",
    name: "Aisha's Mom",
  },
  {
    quote:
      "The BJJ program has taught my son discipline and respect. He has learned that true strength comes from technique, not just power.",
    name: "Ahmed's Dad",
  },
  {
    quote:
      "The archery program is incredible. Our daughter loves learning this traditional skill and the focus it requires.",
    name: "Fatima's Parents",
  },
];

function heroVariant(index: number) {
  return {
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.56,
        delay: 0.04 + index * 0.04,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };
}

function StickyCurriculumCard({ item }: { item: (typeof curriculum)[number] }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.6, 1], reduceMotion ? [1, 1, 1] : [1, 0.975, 0.93]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], reduceMotion ? [1, 1, 1] : [1, 0.97, 0.62]);
  const blur = useTransform(scrollYProgress, [0, 0.65, 1], reduceMotion ? [0, 0, 0] : [0, 1, 7]);
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -18]);

  return (
    <div ref={ref} className="protocol-card relative sticky top-0 h-screen flex items-center justify-center p-6 pt-24">
      <motion.div
        style={{ scale, opacity, y, filter: useTransform(blur, (value) => `blur(${value}px)`) }}
        className={`protocol-content w-full max-w-5xl rounded-[3rem] h-[80vh] shadow-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden ${item.cardClassName}`}
      >
        <div className="flex-1 z-10">
          <span className={`font-mono-label text-xs uppercase tracking-[0.18em] mb-4 block ${item.numberClassName}`}>
            {item.number}
          </span>
          <h3 className={`font-heading text-4xl tracking-tight mb-6 ${item.titleClassName}`}>{item.title}</h3>
          <p className={`font-body text-sm md:text-base max-w-md leading-relaxed mb-6 ${item.bodyClassName}`}>{item.body}</p>
          <ul className={`text-xs font-mono-label space-y-2 uppercase tracking-wide ${item.listClassName}`}>
            {item.bullets.map((bullet) => (
              <li key={bullet}>+ {bullet}</li>
            ))}
          </ul>
        </div>
        <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-[300px]">
          {item.visual}
        </div>
      </motion.div>
    </div>
  );
}

const Home = () => {
  return (
    <MotionPage className="bg-cream text-charcoal">
      <div className="noise-overlay" />

      <header className="relative h-[100dvh] w-full overflow-hidden flex items-end">
        <motion.div
          initial={{ scale: 1.06, opacity: 0.72 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src="/hero-judo.jpg"
            alt="Judo Throw Training"
            className="w-full h-full object-cover object-[center_20%] grayscale brightness-75 contrast-125 opacity-80"
            data-studio-image-slot="home.hero.bg"
          />
          <div className="absolute inset-0 hero-bg-gradient" />
        </motion.div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 md:pb-32">
          <StudioBlock id="home.hero" label="Hero" page="Home">
            <div className="max-w-4xl hero-content">
              <motion.p {...heroVariant(0)} className="text-clay font-mono-label text-xs uppercase tracking-[0.18em] mb-6 flex items-center gap-2">
                <StatusDot ariaLabel="System Initialized" />
                <StudioText k="home.hero.eyebrow" defaultText="System Initialized" as="span" className="inline" />
              </motion.p>
              <h1 className="flex flex-col gap-2">
                <motion.span {...heroVariant(1)} className="font-heading text-5xl md:text-7xl lg:text-[6rem] tracking-tight text-cream leading-none">
                  <StudioText k="home.hero.titleA" defaultText="Built Through" as="span" className="inline" />
                </motion.span>
                <motion.span {...heroVariant(2)} className="font-serif-accent italic text-6xl md:text-8xl lg:text-[8rem] tracking-tight text-cream leading-none mt-2 pr-4">
                  <StudioText k="home.hero.titleB" defaultText="Discipline." as="span" className="inline" />
                </motion.span>
              </h1>
              <motion.p {...heroVariant(3)} className="mt-10 text-cream/70 font-body text-sm md:text-base max-w-lg leading-relaxed">
                <StudioText
                  k="home.hero.subcopy"
                  defaultText="Train the body. Shape the character. Brazilian Jiu-Jitsu, archery, outdoor skills, and bullyproofing taught through a structured youth development system."
                  as="span"
                  className="inline"
                  multiline
                />
              </motion.p>
              <motion.div {...heroVariant(4)} className="mt-12 flex flex-col sm:flex-row gap-4">
                <ClayButton asChild className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/register">
                    <StudioText k="home.hero.ctaPrimary" defaultText="Register Now" as="span" className="inline" />
                  </Link>
                </ClayButton>
                <Link
                  href="/schedule"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-cream/20 text-cream text-[11px] font-normal uppercase tracking-[0.18em] hover:bg-cream/10 transition-colors"
                >
                  <StudioText k="home.hero.ctaSecondary" defaultText="View Schedule" as="span" className="inline" />
                </Link>
              </motion.div>
            </div>
          </StudioBlock>
        </div>
      </header>

      <section id="features" className="py-32 bg-cream relative z-20 rounded-t-[3rem] -mt-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="Academy Telemetry" />
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10% 0px" }} transition={{ duration: 0.5 }} className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <TelemetryCard title="Academy Snapshot" label="Snapshot">
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal/60 uppercase tracking-wide">Active Participants</span>
                  <span className="font-serif-accent text-2xl text-moss">30+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-charcoal/60 uppercase tracking-wide">Age Range</span>
                  <span className="font-serif-accent text-2xl text-moss">6-17</span>
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
                {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => (
                  <div key={`${d}-${index}`} className="text-center text-charcoal/40 font-heading">
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
          </motion.div>
        </div>
      </section>

      <StudioBlock id="home.philosophy" label="Philosophy" page="Home">
        <motion.section
          id="manifesto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.55 }}
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
        </motion.section>
      </StudioBlock>

      <section id="programs" className="relative bg-cream pb-32">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-10">
          <SectionHeader title="Core Curriculum" />
        </div>
        {curriculum.map((item) => (
          <StickyCurriculumCard key={item.id} item={item} />
        ))}
      </section>

      <section id="enrollment" className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <SectionHeader title="Enrollment Tracks" />
            <p className="mt-4 text-charcoal/60 font-body text-sm">
              Select the appropriate development stage for your child.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
          >
            <PremiumCard>
              <span className="font-mono-label text-xs text-charcoal/50 uppercase tracking-[0.18em] mb-2 block">
                Ages 6-9
              </span>
              <h4 className="font-heading text-2xl text-charcoal mb-2">Foundations</h4>
              <p className="text-xs font-body text-charcoal/60 mb-8 border-b border-charcoal/10 pb-6 w-full">
                Focus, basic coordination, and introduction to discipline.
              </p>
            </PremiumCard>
            <PremiumCard>
              <span className="font-mono-label text-xs text-charcoal/50 uppercase tracking-[0.18em] mb-2 block">
                Ages 10-13
              </span>
              <h4 className="font-heading text-2xl text-charcoal mb-2">Development</h4>
              <p className="text-xs font-body text-charcoal/60 mb-8 border-b border-charcoal/10 pb-6 w-full">
                Technical growth, active pressure testing, and real-world application.
              </p>
            </PremiumCard>
            <PremiumCard>
              <span className="font-mono-label text-xs text-charcoal/50 uppercase tracking-[0.18em] mb-2 block">
                Ages 14-17
              </span>
              <h4 className="font-heading text-2xl text-charcoal mb-2">Leadership</h4>
              <p className="text-xs font-body text-charcoal/60 mb-8 border-b border-charcoal/10 pb-6 w-full">
                Advanced capability, outdoor reliance, and guiding younger peers.
              </p>
            </PremiumCard>
          </motion.div>
        </div>
      </section>

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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((item) => (
                <PremiumCard key={item.name} className="bg-white border border-charcoal/10 shadow-sm h-full">
                  <div className="flex gap-1 items-center mb-3 text-yellow-400 text-lg">
                    {"★★★★★".split("").map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </div>
                  <div className="text-4xl leading-none text-clay font-serif-accent h-4 -mb-2">"</div>
                  <p className="font-body text-charcoal/70 italic text-sm leading-relaxed mt-4">{item.quote}</p>
                  <div className="mt-6 flex items-center gap-2 pt-4">
                    <span className="w-8 h-8 rounded-full bg-charcoal/5" />
                    <span className="text-sm font-heading text-charcoal leading-none">{item.name}</span>
                  </div>
                </PremiumCard>
              ))}
            </motion.div>
          </div>
        </section>
      </StudioBlock>
    </MotionPage>
  );
};

export default Home;
