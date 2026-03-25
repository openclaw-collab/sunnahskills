import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClayButton } from "@/components/brand/ClayButton";
import { InfoCard } from "@/components/brand/TelemetryCard";
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
import { BJJ_MARKETING_GROUPS } from "@shared/bjjCatalog";

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

const academyStatusRows = [
  { label: "Live now", value: "Brazilian Jiu-Jitsu" },
  { label: "Active tracks", value: "Girls, Boys, Women, Men" },
  { label: "Built for", value: "Families and adult students" },
];

const snapshotCards = [
  { label: "Active Participants", value: "30+", note: "Current BJJ families and adult students training right now." },
  { label: "Weekly Sessions", value: "8", note: "Live Tuesday, Thursday, Friday, and Saturday blocks." },
  { label: "Family Accounts", value: "1 Login", note: "One account can manage yourself, children, and registration lines." },
  { label: "Trial Flow", value: "QR Ready", note: "Every free-trial booking generates a confirmation and scan code." },
];

const enrollmentCardMeta: Record<
  (typeof BJJ_MARKETING_GROUPS)[number]["key"],
  { eyebrow: string; price: string; accent: string; summary: string }
> = {
  girls: {
    eyebrow: "Youth Track",
    price: "$12 per class",
    accent: "from-moss/18 via-white to-transparent",
    summary: "Technique-first training for younger girls with two weekly class opportunities.",
  },
  boys: {
    eyebrow: "Youth Track",
    price: "$12 per class",
    accent: "from-clay/16 via-white to-transparent",
    summary: "A focused boys track with shared training windows and age-appropriate coaching.",
  },
  women: {
    eyebrow: "Women 11+",
    price: "$80 per month per day",
    accent: "from-charcoal/10 via-white to-transparent",
    summary: "Tuesday and Thursday stay as separate enrollments so each training day can stand on its own.",
  },
  men: {
    eyebrow: "Teen & Adult",
    price: "$14 per class",
    accent: "from-moss/14 via-white to-transparent",
    summary: "Friday and Saturday evening training for older teens and men building consistency.",
  },
};

const schedulePreviewGroups = [
  {
    day: "Tuesday",
    items: [
      { track: "Women 11+", time: "12:30–2:00 PM" },
      { track: "Girls 5–10", time: "2:30–3:30 PM" },
      { track: "Boys 7–13", time: "2:30–3:30 PM" },
    ],
  },
  {
    day: "Thursday",
    items: [{ track: "Women 11+", time: "8:00–9:30 PM" }],
  },
  {
    day: "Friday",
    items: [
      { track: "Girls 5–10", time: "10:00–11:00 AM" },
      { track: "Boys 7–13", time: "10:00–11:00 AM" },
      { track: "Men 14+", time: "8:00–9:00 PM" },
    ],
  },
  {
    day: "Saturday",
    items: [{ track: "Men 14+", time: "8:00–9:00 PM" }],
  },
];

function heroVariant(index: number, reduceMotion: boolean) {
  if (reduceMotion) return {};
  return {
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.48,
        delay: 0.04 + index * 0.04,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };
}

function StickyCurriculumCard({ item }: { item: (typeof curriculum)[number] }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="protocol-card relative sticky top-0 h-screen flex items-center justify-center p-6 pt-24">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0.94, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-5% 0px -5% 0px" }}
        transition={reduceMotion ? undefined : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className={`protocol-content w-full max-w-6xl rounded-[3rem] h-[80vh] shadow-2xl overflow-hidden ${item.cardClassName}`}
      >
        <div className="flex h-full flex-col md:flex-row">
          <div className="flex flex-1 items-center p-10 md:p-14">
            <div className="z-10">
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
          </div>
          <div className="relative md:w-1/2 min-h-[260px] md:min-h-full overflow-hidden border-t border-charcoal/10 md:border-t-0 md:border-l md:border-charcoal/10">
            <div className="absolute inset-0">{item.visual}</div>
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/10 md:bg-gradient-to-t md:from-black/5 md:to-transparent" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SnapshotDeck() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % snapshotCards.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="relative mt-6 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="grid grid-cols-2 gap-2 rounded-[1.6rem] border border-charcoal/8 bg-cream/45 p-2">
        {snapshotCards.map((card, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-[1.05rem] border px-3 py-3 text-left transition-all ${
                isActive
                  ? "border-moss/25 bg-white shadow-[0_10px_26px_rgba(26,26,26,0.08)]"
                  : "border-transparent bg-transparent text-charcoal/60 hover:border-charcoal/8 hover:bg-white/40"
              }`}
            >
              <div className="font-mono-label text-[9px] uppercase tracking-[0.16em] text-charcoal/45">{card.label}</div>
              <div className={`mt-2 font-serif-accent text-2xl italic ${isActive ? "text-moss" : "text-charcoal/72"}`}>{card.value}</div>
            </button>
          );
        })}
      </div>

      <div className="relative min-h-[17rem] rounded-[1.6rem] border border-charcoal/10 bg-white px-5 py-5 shadow-[0_20px_52px_rgba(26,26,26,0.09)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={snapshotCards[activeIndex].label}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={reduceMotion ? undefined : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                  {snapshotCards[activeIndex].label}
                </div>
                <div className="mt-4 font-serif-accent text-5xl italic leading-none text-moss">
                  {snapshotCards[activeIndex].value}
                </div>
              </div>
              <span className="rounded-full border border-moss/15 bg-moss/6 px-3 py-1 font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/55">
                Live now
              </span>
            </div>
            <p className="mt-8 max-w-[24rem] text-sm leading-relaxed text-charcoal/68">{snapshotCards[activeIndex].note}</p>
            <div className="mt-auto pt-8">
              <div className="flex items-center gap-1.5">
                {snapshotCards.map((card, index) => (
                  <button
                    key={`indicator-${card.label}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show ${card.label}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeIndex ? "w-7 bg-charcoal/65" : "w-3 bg-charcoal/18 hover:bg-charcoal/35"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MiniScheduleCalendar() {
  return (
    <div className="rounded-[1.6rem] border border-charcoal/10 bg-white p-4 shadow-[0_20px_56px_rgba(26,26,26,0.07)]">
      <div className="mb-4 flex items-center justify-between rounded-[1rem] border border-charcoal/8 bg-cream/45 px-4 py-3">
        <div>
          <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/42">Spring Semester</div>
          <div className="mt-1 font-heading text-lg text-charcoal">Weekly training calendar</div>
        </div>
        <div className="rounded-full border border-moss/15 bg-moss/6 px-3 py-1 font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/55">
          Tue to Sat
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {schedulePreviewGroups.map((group) => (
          <div key={group.day} className="rounded-[1.25rem] border border-charcoal/8 bg-cream/55 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/40">{group.day}</div>
              <div className="h-8 w-8 rounded-full border border-charcoal/8 bg-white text-center font-heading text-sm leading-8 text-charcoal">
                {group.day.slice(0, 1)}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {group.items.map((row) => (
                <div key={`${group.day}-${row.track}-${row.time}`} className="rounded-xl border border-charcoal/6 bg-white px-3 py-3 shadow-[0_8px_22px_rgba(26,26,26,0.05)]">
                  <div className="font-heading text-[13px] leading-none text-charcoal">{row.track}</div>
                  <div className="mt-2 inline-flex rounded-full bg-clay/10 px-2.5 py-1 font-mono-label text-[8px] uppercase tracking-[0.14em] text-clay">
                    {row.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Home = () => {
  const reduceMotion = useReducedMotion();
  const prefersReducedMotion = Boolean(reduceMotion);
  return (
    <MotionPage className="bg-cream text-charcoal">
      <div className="noise-overlay" />

      <header className="relative h-[100dvh] w-full overflow-hidden flex items-end">
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 1.04, opacity: 0.78 }}
          animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
          transition={prefersReducedMotion ? undefined : { duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
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
              <motion.p {...heroVariant(0, prefersReducedMotion)} className="text-clay font-mono-label text-xs uppercase tracking-[0.18em] mb-6 flex items-center gap-2">
                <StatusDot ariaLabel="Training in progress" />
                <StudioText k="home.hero.eyebrow" defaultText="Training in Progress" as="span" className="inline" />
              </motion.p>
              <h1 className="flex flex-col gap-2">
                <motion.span {...heroVariant(1, prefersReducedMotion)} className="font-heading text-5xl md:text-7xl lg:text-[6rem] tracking-tight text-cream leading-none text-balance">
                  <StudioText k="home.hero.titleA" defaultText="Built Through" as="span" className="inline" />
                </motion.span>
                <motion.span {...heroVariant(2, prefersReducedMotion)} className="font-serif-accent italic text-6xl md:text-8xl lg:text-[8rem] tracking-tight text-cream leading-none mt-2 pr-4 text-balance">
                  <StudioText k="home.hero.titleB" defaultText="Discipline." as="span" className="inline" />
                </motion.span>
              </h1>
              <motion.p {...heroVariant(3, prefersReducedMotion)} className="mt-10 text-cream/70 font-body text-sm md:text-base max-w-lg leading-relaxed text-pretty">
                <StudioText
                  k="home.hero.subcopy"
                  defaultText="Train the body. Shape the character. Brazilian Jiu-Jitsu, archery, outdoor skills, and bullyproofing taught through a structured youth development system."
                  as="span"
                  className="inline"
                  multiline
                />
              </motion.p>
              <motion.div {...heroVariant(4, prefersReducedMotion)} className="mt-12 flex flex-col sm:flex-row gap-4">
                <ClayButton asChild className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/register">
                    <StudioText k="home.hero.ctaPrimary" defaultText="Register Now" as="span" className="inline" />
                  </Link>
                </ClayButton>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-cream/20 text-cream text-[11px] font-normal uppercase tracking-[0.18em] hover:bg-cream/10 transition-colors"
                >
                  <StudioText k="home.hero.ctaSecondary" defaultText="Open Your Account" as="span" className="inline" />
                </Link>
              </motion.div>
            </div>
          </StudioBlock>
        </div>
      </header>

      <section id="overview" className="py-32 bg-cream relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Current Sessions" title="This Week at Sunnah Skills" />
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={prefersReducedMotion ? undefined : { duration: 0.42 }}
            className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.05fr_1fr]"
          >
            <InfoCard title="Academy Snapshot" label="Snapshot" className="md:order-1 overflow-hidden">
              <div className="space-y-3">
                {academyStatusRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-2xl border border-charcoal/8 bg-cream/40 px-4 py-3">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-charcoal/50">{row.label}</span>
                    <span className="font-heading text-right text-sm text-charcoal">{row.value}</span>
                  </div>
                ))}
                <SnapshotDeck />
              </div>
            </InfoCard>

            <DarkCard className="md:order-2 order-3">
              <div className="mb-5 flex items-center gap-3">
                <StatusDot ariaLabel="Technique preview" />
                <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                  Inside Training
                </span>
              </div>
              <div className="relative w-full h-72 bg-charcoal rounded-2xl overflow-hidden border border-moss/20">
                <TechniqueViewer className="w-full h-full" controlsMode="none" autoplay />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-charcoal via-charcoal/18 to-transparent" />
              </div>
              <p className="mt-5 text-sm leading-relaxed text-cream/68">
                A quiet look at how technique is taught at Sunnah Skills. The full interactive library lives on the techniques page.
              </p>
              <div className="mt-4">
                <Link href="/techniques" className="font-mono-label text-[11px] uppercase tracking-[0.18em] text-moss hover:text-cream">
                  View technique library
                </Link>
              </div>
            </DarkCard>

            <InfoCard title="Weekly Schedule" label="Current sessions" className="md:order-3 order-2">
              <div className="space-y-4">
                <MiniScheduleCalendar />
                <div className="rounded-2xl border border-moss/15 bg-moss/5 px-4 py-3 text-xs leading-relaxed text-charcoal/70">
                  Women Tuesday and Thursday are separate enrollments. Friday youth classes share the same training window but stay in distinct tracks.
                </div>
              </div>
            </InfoCard>
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
              BJJ is live now, with every public surface aligned to the same household-ready cohort structure.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start"
          >
            {BJJ_MARKETING_GROUPS.map((group) => (
              <PremiumCard key={group.key} className="relative h-full overflow-hidden border border-charcoal/10 bg-white p-0">
                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${enrollmentCardMeta[group.key].accent}`} />
                <div className="relative flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono-label text-[10px] text-charcoal/48 uppercase tracking-[0.18em] mb-2 block">
                        {enrollmentCardMeta[group.key].eyebrow}
                      </span>
                      <h4 className="font-heading text-2xl text-charcoal">{group.label}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-charcoal/62">{enrollmentCardMeta[group.key].summary}</p>
                    </div>
                    <div className="rounded-full border border-charcoal/10 bg-white/85 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.16em] text-charcoal/55 backdrop-blur">
                      {group.sessions.length} session{group.sessions.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-charcoal/8 bg-cream/45 px-4 py-3">
                    <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/45">{group.ageLabel}</div>
                    <div className="mt-2 font-heading text-lg text-clay">{enrollmentCardMeta[group.key].price}</div>
                  </div>
                  <div className="mt-4 flex-1 space-y-3">
                    {group.sessions.map((session) => (
                      <div key={session.trackKey} className="rounded-2xl border border-charcoal/8 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(26,26,26,0.05)]">
                        <div className="font-body text-sm text-charcoal">{session.label}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-charcoal/50">
                          {session.scheduleLabel}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PremiumCard>
            ))}
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
