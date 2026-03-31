import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { StatusDot } from "@/components/brand/StatusDot";
import { ProgramVisual } from "@/components/programs/ProgramVisual";
import scenesData from "@grapplemap-preview/scenes.json";
import type { TechniqueSequence } from "@/lib/grapplemap-types";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionPage } from "@/components/motion/PageMotion";
import { PROGRAMS } from "@/lib/programConfig";
import { motionTime } from "@/lib/motion";
import { useProgramsCatalog } from "@/hooks/useProgramsCatalog";
import { BJJ_MARKETING_GROUPS, BJJ_TRACK_BY_KEY, isBjjTrackKey } from "@shared/bjjCatalog";
import { formatMoneyFromCents } from "@shared/money";
import { resolveClassesInSemester } from "@shared/orderPricing";

const DEFAULT_HOME_TECHNIQUE_SEQUENCE_PATH = "/api/techniques?id=double-leg-to-mount-escape-full-chain";
const HOME_BUNDLED_SCENE_ID = "1383"; // Uchimata scene from bundled scenes.json

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
    visual: <ProgramVisual slug="bjj" variant="card" className="h-full" />,
    link: "/programs/bjj",
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
    visual: <ProgramVisual slug="archery" variant="card" className="h-full" />,
    link: "/programs/archery",
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
    visual: <ProgramVisual slug="outdoor" variant="card" className="h-full" />,
    link: "/programs/outdoor",
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
    visual: <ProgramVisual slug="bullyproofing" variant="card" className="h-full" />,
    link: "/programs/bullyproofing",
  },
  {
    id: "swimming",
    number: "Discipline 05",
    title: PROGRAMS.swimming.name,
    body: PROGRAMS.swimming.heroLead,
    bullets: PROGRAMS.swimming.highlights,
    cardClassName: "bg-white border border-charcoal/10",
    numberClassName: "text-moss",
    titleClassName: "text-charcoal",
    bodyClassName: "text-charcoal/70",
    listClassName: "text-charcoal/60",
    visual: <ProgramVisual slug="swimming" variant="card" className="h-full" />,
    link: "/programs/swimming",
  },
  {
    id: "horseback",
    number: "Discipline 06",
    title: PROGRAMS.horseback.name,
    body: PROGRAMS.horseback.heroLead,
    bullets: PROGRAMS.horseback.highlights,
    cardClassName: "bg-moss text-cream border border-charcoal/20",
    numberClassName: "text-clay",
    titleClassName: "text-cream",
    bodyClassName: "text-cream/75",
    listClassName: "text-cream/65",
    visual: <ProgramVisual slug="horseback" variant="card" className="h-full" />,
    link: "/programs/horseback",
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
    name: "Hammad's Dad",
  },
  {
    quote:
      "The archery program is incredible. Our daughter loves learning this traditional skill and the focus it requires.",
    name: "Fatima's Parents",
  },
];

const academyStatusRows = [
  { label: "Active Programs", value: "Brazilian Jiu-Jitsu" },
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
  { eyebrow: string; accent: string; summary: string }
> = {
  girls: {
    eyebrow: "Ages 5–10",
    accent: "from-moss/18 via-white to-transparent",
    summary: "Tuesday 2:30–3:30 PM, Friday 10:00–11:00 AM",
  },
  boys: {
    eyebrow: "Ages 7–13",
    accent: "from-clay/16 via-white to-transparent",
    summary: "Tuesday 2:30–3:30 PM, Friday 10:00–11:00 AM",
  },
  women: {
    eyebrow: "Ages 11+",
    accent: "from-charcoal/10 via-white to-transparent",
    summary: "Tuesday 12:30–2:00 PM or Thursday 8:00–9:30 PM",
  },
  men: {
    eyebrow: "Ages 14+",
    accent: "from-moss/14 via-white to-transparent",
    summary: "Friday 8:00–9:00 PM, Saturday 8:00–9:00 PM",
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
        duration: motionTime(0.48),
        delay: motionTime(0.04 + index * 0.04),
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };
}

function StickyCurriculumCard({ item }: { item: (typeof curriculum)[number] }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="protocol-card relative flex min-h-[40rem] items-center justify-center px-4 py-8 md:px-6 md:py-10 lg:sticky lg:top-0 lg:h-screen lg:p-6 lg:pt-24" data-testid={`curriculum-card-${item.id}`}>
      <Link href={item.link} className="w-full flex justify-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0.94, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px -5% 0px" }}
          transition={reduceMotion ? undefined : { duration: motionTime(0.32), ease: [0.16, 1, 0.3, 1] }}
          className={`protocol-content h-full min-h-[36rem] w-[94%] md:w-[88%] lg:w-[80%] xl:w-[75%] mx-auto overflow-hidden rounded-[3rem] shadow-2xl lg:h-[80vh] ${item.cardClassName}`}
        >
          <div className="flex h-full flex-col lg:flex-row">
            <div className="flex flex-1 items-center p-8 md:p-10 lg:p-12 xl:p-14">
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
            <div className="relative min-h-[280px] overflow-hidden border-t border-charcoal/10 lg:min-h-full lg:w-[48%] lg:border-l lg:border-t-0 lg:border-charcoal/10">
              <div className="absolute inset-0">{item.visual}</div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-black/10" />
            </div>
          </div>
        </motion.div>
      </Link>
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
    <div className="relative mt-4 flex h-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        {snapshotCards.map((card, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`min-h-[5.5rem] rounded-[1.15rem] border px-3.5 py-3 text-left transition-all ${
                isActive
                  ? "border-charcoal/15 bg-charcoal text-cream shadow-sm"
                  : "border-charcoal/8 bg-cream/45 text-charcoal/70 hover:border-charcoal/15 hover:bg-white"
              }`}
            >
              <div className={`font-mono-label text-[9px] uppercase tracking-[0.14em] ${isActive ? "text-cream/55" : "text-charcoal/45"}`}>
                {card.label}
              </div>
              <div className={`mt-2.5 font-serif-accent text-[1.7rem] italic leading-none ${isActive ? "text-clay" : "text-charcoal"}`}>
                {card.value}
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[1.5rem] border border-charcoal/10 bg-white shadow-sm">
        <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top_left,rgba(170,95,72,0.14),transparent_58%)]" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.div
            key={snapshotCards[activeIndex].label}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={reduceMotion ? undefined : { duration: motionTime(0.32), ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full min-h-[11rem] flex-col px-4 py-4 lg:px-5 lg:py-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                  {snapshotCards[activeIndex].label}
                </div>
                <div className="mt-3 font-serif-accent text-[2.5rem] italic leading-none text-charcoal">
                  {snapshotCards[activeIndex].value}
                </div>
              </div>
              <span className="rounded-full border border-charcoal/10 bg-charcoal/5 px-3 py-1 font-mono-label text-[9px] uppercase tracking-[0.16em] text-charcoal/55">
                Academy now
              </span>
            </div>

            <p className="mt-3.5 max-w-[18rem] text-[13px] leading-relaxed text-charcoal/70 text-pretty">
              {snapshotCards[activeIndex].note}
            </p>

            <div className="mt-auto flex items-end justify-between gap-4 pt-4">
              <div className="max-w-[10rem] rounded-[1rem] border border-charcoal/8 bg-cream/55 px-3 py-2.5">
                <div className="font-mono-label text-[8px] uppercase tracking-[0.14em] text-charcoal/45">Why it matters</div>
                <div className="mt-1.5 text-[11px] leading-relaxed text-charcoal/65">
                  Parents can see exactly how the academy is paced before they commit to registration.
                </div>
              </div>
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
    <div className="rounded-[1.35rem] border border-charcoal/10 bg-white p-3.5 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 rounded-[1rem] border border-charcoal/8 bg-cream/45 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/42">Spring Semester</div>
          <div className="mt-1 font-heading text-base text-charcoal">Weekly training calendar</div>
        </div>
        <div className="rounded-full border border-moss/15 bg-moss/6 px-3 py-1 font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/55">
          Tue to Sat
        </div>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {schedulePreviewGroups.map((group) => (
          <div key={group.day} className="rounded-[1.15rem] border border-charcoal/8 bg-cream/55 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/40">{group.day}</div>
              <div className="h-7 w-7 rounded-full border border-charcoal/8 bg-white text-center font-heading text-xs leading-7 text-charcoal">
                {group.day.slice(0, 1)}
              </div>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {group.items.map((row) => (
                <div key={`${group.day}-${row.track}-${row.time}`} className="rounded-xl border border-charcoal/6 bg-white px-3 py-2.5 shadow-sm">
                  <div className="font-heading text-[12px] leading-none text-charcoal">{row.track}</div>
                  <div className="mt-1.5 inline-flex rounded-full bg-clay/10 px-2 py-1 font-mono-label text-[8px] uppercase tracking-[0.12em] text-clay">
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

function formatEnrollmentSemesterPrice(amountCents: number | null) {
  if (!amountCents || amountCents <= 0) return "Loading semester tuition";
  return `${formatMoneyFromCents(amountCents)} semester`;
}

function formatEnrollmentSessionPrice(amountCents: number | null) {
  if (!amountCents || amountCents <= 0) return "Loading session rate";
  return `${formatMoneyFromCents(amountCents)} per session`;
}

function parseWeeklySessions(metadata: string | null, trackKey: string) {
  try {
    const parsed = metadata ? JSON.parse(metadata) as { weekly_sessions?: number } : null;
    const weeklySessions = Number(parsed?.weekly_sessions);
    if (Number.isFinite(weeklySessions) && weeklySessions > 0) return weeklySessions;
  } catch {
    /* ignore malformed metadata */
  }

  if (isBjjTrackKey(trackKey)) return BJJ_TRACK_BY_KEY[trackKey].meetingDays.length;
  return null;
}

const Home = () => {
  const reduceMotion = useReducedMotion();
  const prefersReducedMotion = Boolean(reduceMotion);
  const { data: catalogData } = useProgramsCatalog();
  const bjjProgram = catalogData?.programs.find((program) => program.id === "bjj");
  const activeSemester = bjjProgram?.active_semester ?? null;
  const activeSemesterLabel = activeSemester?.name?.trim() || "Current semester";
  const activeSemesterWeeks =
    Number.isFinite(Number(activeSemester?.classes_in_semester)) && Number(activeSemester?.classes_in_semester) > 0
      ? Number(activeSemester?.classes_in_semester)
      : null;
  const activeSemesterDescriptor = activeSemesterWeeks
    ? `${activeSemesterWeeks}-week semester`
    : "Full-term semester";

  const enrollmentPricingByTrack = new Map(
    (bjjProgram?.prices ?? []).map((price) => {
      const semesterClassCount = resolveClassesInSemester(
        price.metadata ?? null,
        activeSemester,
        price.age_group,
        activeSemester?.start_date ?? undefined,
      );
      const semesterTuitionCents = Math.max(0, Number(price.amount ?? 0)) * Math.max(0, semesterClassCount);
      return [
        price.age_group,
        {
          semesterTuitionCents,
          perSessionCents: Math.max(0, Number(price.amount ?? 0)) || null,
          weeklySessions: parseWeeklySessions(price.metadata ?? null, price.age_group),
        },
      ] as const;
    }),
  );

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
                  defaultText="Train the body. Shape the character. Brazilian Jiu-Jitsu, Archery, Swimming, Outdoor skills, Self Defense/Bullyproofing all taught through a structured youth centered, sunnah inspired system."
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
                  href="/trial"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border border-cream/20 text-cream text-[11px] font-normal uppercase tracking-[0.18em] hover:bg-cream/10 transition-colors"
                >
                  <StudioText k="home.hero.ctaSecondary" defaultText="Start Free Trial" as="span" className="inline" />
                </Link>
              </motion.div>
            </div>
          </StudioBlock>
        </div>
      </header>

      <section id="overview" className="relative z-20 overflow-hidden bg-cream py-24 xl:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-10 h-72 bg-[radial-gradient(circle_at_center,rgba(170,95,72,0.08),transparent_64%)]" aria-hidden />
        <div className="relative mx-auto max-w-[92rem] px-6">
          <SectionHeader eyebrow="Current Sessions" title="This Week at Sunnah Skills" />
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={prefersReducedMotion ? undefined : { duration: motionTime(0.42) }}
            className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(18rem,0.95fr)_minmax(18rem,0.95fr)_minmax(25rem,1.2fr)] xl:items-stretch xl:gap-5 2xl:grid-cols-[minmax(18rem,0.92fr)_minmax(19rem,0.96fr)_minmax(27rem,1.22fr)]"
            data-testid="home-overview"
          >
            <CollapsibleSection title="Academy Snapshot" className="overflow-hidden lg:order-1 xl:min-h-[31rem] border-charcoal/8 bg-cream/55">
              <div className="flex h-full flex-col space-y-3">
                {academyStatusRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-2xl border border-charcoal/8 bg-cream/40 px-4 py-3">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-charcoal/50">{row.label}</span>
                    <span className="font-heading text-right text-sm text-charcoal">{row.value}</span>
                  </div>
                ))}
                <div data-testid="academy-snapshot-card">
                  <SnapshotDeck />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Technique Preview" className="order-2 lg:order-2 xl:min-h-[31rem] bg-charcoal border-charcoal/20">
              <DarkCard className="h-full flex flex-col !border-none !rounded-none !bg-transparent">
                <div className="mb-5 flex items-center gap-3">
                  <StatusDot ariaLabel="Technique preview" />
                  <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
                    Inside Training
                  </span>
                </div>
                <div className="relative w-full h-72 bg-charcoal rounded-2xl overflow-hidden border border-moss/20">
                  <TechniqueViewer
                    className="w-full h-full"
                    controlsMode="none"
                    autoplay
                    sequenceData={scenesData.scenes["1383"] as unknown as TechniqueSequence}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-charcoal via-charcoal/18 to-transparent" />
                </div>
                <p className="mt-5 text-sm leading-relaxed text-cream/68">
                  Review techniques after class with our animated 3D breakdowns. Full library available anytime.
                </p>
                <div className="mt-4">
                  <Link href="/techniques" className="font-mono-label text-[11px] uppercase tracking-[0.18em] text-moss hover:text-cream">
                    View technique library
                  </Link>
                </div>
              </DarkCard>
            </CollapsibleSection>
            <CollapsibleSection title="Weekly Schedule" className="order-3 lg:col-span-2 xl:col-span-1 xl:min-h-[31rem]">
              <div data-testid="home-mini-schedule">
                <MiniScheduleCalendar />
              </div>
              <div className="mt-4 rounded-2xl border border-moss/15 bg-moss/5 px-4 py-3 text-[11px] leading-relaxed text-charcoal/70">
                Women's Tuesday and Thursday sessions are separate enrollments. Tuesday and Friday youth sessions occur at the same time but are segregated.
              </div>
            </CollapsibleSection>
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
          <SectionHeader title="Programs at a glance" />
        </div>
        {curriculum.map((item) => (
          <StickyCurriculumCard key={item.id} item={item} />
        ))}
      </section>

      <section id="enrollment" className="py-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <SectionHeader title="BJJ Sessions" />
            <p className="mt-4 text-charcoal/60 font-body text-sm">
              Weekly classes at 918 Dundas St. West, Mississauga. Register for the current semester.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: motionTime(0.5) }}
            className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:gap-8 2xl:grid-cols-4"
            data-testid="enrollment-tracks"
          >
            {BJJ_MARKETING_GROUPS.map((group) => (
              <PremiumCard key={group.key} className="relative h-full overflow-hidden border border-charcoal/10 bg-white p-0" data-testid={`enrollment-card-${group.key}`}>
                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${enrollmentCardMeta[group.key].accent}`} />
                <div className="relative flex h-full flex-col p-6 lg:p-7 xl:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="font-mono-label text-[10px] text-charcoal/48 uppercase tracking-[0.18em] mb-2 block">
                        {enrollmentCardMeta[group.key].eyebrow}
                      </span>
                      <h4 className="font-heading text-2xl text-charcoal xl:text-[1.85rem]">{group.label}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-charcoal/62">{enrollmentCardMeta[group.key].summary}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-charcoal/42">
                        {group.sessions.length > 1
                          ? `${activeSemesterDescriptor}. Choose one session or register for both.`
                          : `${activeSemesterDescriptor}. ${enrollmentPricingByTrack.get(group.sessions[0]?.trackKey)?.weeklySessions ?? 1} class${(enrollmentPricingByTrack.get(group.sessions[0]?.trackKey)?.weeklySessions ?? 1) === 1 ? "" : "es"} per week.`}
                      </p>
                    </div>
                    <Link href="/register/bjj">
                      <ClayButton className="text-[10px] uppercase tracking-[0.16em] px-4 py-2">
                        Register Now
                      </ClayButton>
                    </Link>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-sm text-charcoal/70">
                    <svg className="h-4 w-4 text-charcoal/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>918 Dundas St. West, Mississauga</span>
                  </div>
                  <div className="mt-4 flex-1 space-y-3">
                    {group.sessions.map((session) => (
                      <div key={session.trackKey} className="rounded-2xl border border-charcoal/8 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(26,26,26,0.05)] lg:px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-body text-sm text-charcoal">{session.label}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-charcoal/50">
                              {session.scheduleLabel}
                            </div>
                            <div className="mt-2 text-[12px] leading-relaxed text-charcoal/58">
                              {formatEnrollmentSessionPrice(
                                enrollmentPricingByTrack.get(session.trackKey)?.perSessionCents ?? null,
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full border border-clay/12 bg-clay/8 px-3 py-1.5 text-right">
                            <div className="font-mono-label text-[8px] uppercase tracking-[0.16em] text-charcoal/40">
                              Semester tuition
                            </div>
                            <div className="mt-1 font-heading text-[0.95rem] leading-none text-clay">
                              {formatEnrollmentSemesterPrice(
                                enrollmentPricingByTrack.get(session.trackKey)?.semesterTuitionCents ?? null,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <Link href="/register/bjj">
                      <ClayButton className="w-full justify-center">
                        Register Now
                      </ClayButton>
                    </Link>
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
                <StudioText k="home.testimonials.heading" defaultText="Book your FREE trial now!" as="span" className="inline" />
              </h3>
              <p className="font-body text-sm md:text-base text-charcoal/60">
                <StudioText k="home.testimonials.subheading" defaultText="Join dozens of families who have experienced the Sunnah Skills difference. Schedule your first class today." as="span" className="inline" multiline />
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
