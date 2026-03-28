import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClayButton } from "@/components/brand/ClayButton";
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
import { motionTime } from "@/lib/motion";
import { useProgramsCatalog } from "@/hooks/useProgramsCatalog";
import { BJJ_MARKETING_GROUPS } from "@shared/bjjCatalog";
import { formatMoneyFromCents } from "@shared/money";
import { resolveClassesInSemester } from "@shared/orderPricing";

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
  { eyebrow: string; accent: string; summary: string }
> = {
  girls: {
    eyebrow: "Available now",
    accent: "from-moss/18 via-white to-transparent",
    summary: "A live girls cohort with a clear Tuesday and Friday rhythm across the current semester.",
  },
  boys: {
    eyebrow: "Available now",
    accent: "from-clay/16 via-white to-transparent",
    summary: "A focused boys cohort built around the same steady twice-weekly semester structure.",
  },
  women: {
    eyebrow: "Separate enrollments",
    accent: "from-charcoal/10 via-white to-transparent",
    summary: "Tuesday and Thursday remain separate enrollments so each training day carries its own semester tuition.",
  },
  men: {
    eyebrow: "Teen & adult",
    accent: "from-moss/14 via-white to-transparent",
    summary: "One evening track for older teens and men, paced across the full semester calendar.",
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
    <div className="protocol-card relative flex min-h-[40rem] items-center justify-center px-4 py-8 md:px-6 md:py-10 lg:sticky lg:top-0 lg:h-screen lg:p-6 lg:pt-24">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0.94, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-5% 0px -5% 0px" }}
        transition={reduceMotion ? undefined : { duration: motionTime(0.32), ease: [0.16, 1, 0.3, 1] }}
        className={`protocol-content h-full min-h-[36rem] w-full max-w-6xl overflow-hidden rounded-[3rem] shadow-2xl lg:h-[80vh] ${item.cardClassName}`}
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

function PhilosophyPreview() {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-charcoal/10 bg-charcoal px-5 py-6 text-cream shadow-[0_24px_70px_rgba(26,26,26,0.16)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(206,88,51,0.18),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(110,160,122,0.16),transparent_34%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">The Philosophy</div>
        <div className="mt-4 text-xl text-cream/58 md:text-2xl">
          <StudioText
            k="home.philosophy.subheading"
            defaultText="Most programs keep children busy."
            as="span"
            className="inline"
          />
        </div>
        <div className="mt-2 font-serif-accent text-4xl italic leading-none text-cream md:text-5xl">
          <StudioText k="home.philosophy.heading" defaultText="We build discipline." as="span" className="inline" />
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cream/72 md:text-base">
          <StudioText
            k="home.philosophy.body"
            defaultText="Strength without character is incomplete. Character without training is fragile. Sunnah Skills develops confidence, restraint, and capability through serious, structured training."
            as="span"
            className="inline"
            multiline
          />
        </p>
      </div>
    </div>
  );
}

function AcademyExplorer({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const [openId, setOpenId] = useState<"snapshot" | "technique" | "schedule" | "philosophy">("technique");

  const items = [
    {
      id: "snapshot" as const,
      label: "Academy snapshot",
      eyebrow: "Live now",
      summary: "Current tracks, participation rhythm, and the academy pulse in one compact view.",
      content: (
        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-3">
            {academyStatusRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-2xl border border-charcoal/8 bg-cream/40 px-4 py-3">
                <span className="text-[10px] uppercase tracking-[0.16em] text-charcoal/50">{row.label}</span>
                <span className="font-heading text-right text-sm text-charcoal">{row.value}</span>
              </div>
            ))}
          </div>
          <div data-testid="academy-snapshot-card">
            <SnapshotDeck />
          </div>
        </div>
      ),
    },
    {
      id: "technique" as const,
      label: "Technique viewer",
      eyebrow: "Inside training",
      summary: "A direct look at how the technique library feels before someone opens the full page.",
      content: (
        <div className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
          <DarkCard className="flex min-h-[24rem] flex-col">
            <div className="mb-5 flex items-center gap-3">
              <StatusDot ariaLabel="Technique preview" />
              <span className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">Inside Training</span>
            </div>
            <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-moss/20 bg-charcoal md:h-[22rem]">
              <TechniqueViewer className="h-full w-full" controlsMode="none" autoplay />
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
          <div className="rounded-[1.75rem] border border-charcoal/10 bg-white p-5 shadow-[0_24px_70px_rgba(26,26,26,0.08)]">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/48">Why families open this</div>
            <h3 className="mt-3 font-heading text-2xl text-charcoal">The training looks real before the trial starts.</h3>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/64">
              Parents do not have to imagine what “structured BJJ” means. They can see the tone, pacing, and seriousness before they commit.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-charcoal/8 bg-cream/45 px-4 py-4">
                <div className="font-mono-label text-[9px] uppercase tracking-[0.16em] text-charcoal/45">View style</div>
                <div className="mt-2 font-heading text-lg text-charcoal">Quiet autoplay</div>
                <div className="mt-2 text-sm leading-relaxed text-charcoal/62">No clutter, no editing chrome, just the motion and mat space.</div>
              </div>
              <div className="rounded-2xl border border-charcoal/8 bg-cream/45 px-4 py-4">
                <div className="font-mono-label text-[9px] uppercase tracking-[0.16em] text-charcoal/45">Why it matters</div>
                <div className="mt-2 font-heading text-lg text-charcoal">Trust through clarity</div>
                <div className="mt-2 text-sm leading-relaxed text-charcoal/62">The preview reassures families that the academy is organized and technically serious.</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "schedule" as const,
      label: "Weekly schedule",
      eyebrow: "Current sessions",
      summary: "Open the live rhythm quickly without forcing everyone to scroll through the full schedule page.",
      content: (
        <div className="space-y-4">
          <div data-testid="home-mini-schedule">
            <MiniScheduleCalendar />
          </div>
          <div className="rounded-2xl border border-moss/15 bg-moss/5 px-4 py-3 text-[11px] leading-relaxed text-charcoal/70">
            Women Tuesday and Thursday are separate enrollments. Friday youth classes share the same training window but stay in distinct tracks.
          </div>
        </div>
      ),
    },
    {
      id: "philosophy" as const,
      label: "Philosophy",
      eyebrow: "Why it exists",
      summary: "The short version of what Sunnah Skills is trying to shape beyond attendance and activity.",
      content: <PhilosophyPreview />,
    },
  ];

  return (
    <StudioBlock id="home.explorer" label="Academy explorer" page="Home">
      <section id="academy-explorer" className="relative z-20 overflow-hidden bg-cream py-18 md:py-22">
        <div className="pointer-events-none absolute inset-x-0 top-8 h-80 bg-[radial-gradient(circle_at_center,rgba(170,95,72,0.08),transparent_64%)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6">
          <SectionHeader eyebrow="Explore the Academy" title="Choose what to preview first" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-charcoal/62">
            Open only the parts you want to inspect, then jump straight into the core curriculum below.
          </p>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={prefersReducedMotion ? undefined : { duration: motionTime(0.38) }}
            className="mt-10 space-y-4"
            data-testid="home-academy-explorer"
          >
            {items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  data-testid={`academy-explorer-${item.id}`}
                  className={`overflow-hidden rounded-[1.75rem] border transition-all ${
                    isOpen
                      ? "border-charcoal/14 bg-white shadow-[0_30px_90px_rgba(26,26,26,0.08)]"
                      : "border-charcoal/8 bg-white/70 shadow-[0_12px_40px_rgba(26,26,26,0.04)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId((current) => (current === item.id ? item.id : item.id))}
                    data-testid={`academy-explorer-trigger-${item.id}`}
                    className="flex w-full items-start justify-between gap-6 px-5 py-5 text-left md:px-6 md:py-6"
                    aria-expanded={isOpen}
                  >
                    <div className="max-w-3xl">
                      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/46">{item.eyebrow}</div>
                      <div className="mt-2 font-heading text-2xl tracking-tight text-charcoal">{item.label}</div>
                      <div className="mt-2 text-sm leading-relaxed text-charcoal/60">{item.summary}</div>
                    </div>
                    <div
                      className={`mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg transition-transform ${
                        isOpen
                          ? "border-charcoal/14 bg-charcoal text-cream rotate-45"
                          : "border-charcoal/10 bg-cream/45 text-charcoal/65"
                      }`}
                      aria-hidden
                    >
                      +
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={prefersReducedMotion ? undefined : { height: "auto", opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={prefersReducedMotion ? undefined : { duration: motionTime(0.28), ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-t border-charcoal/8"
                      >
                        <div className="px-5 py-5 md:px-6 md:py-6">{item.content}</div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </StudioBlock>
  );
}

function formatEnrollmentSemesterPrice(amountCents: number | null) {
  if (!amountCents || amountCents <= 0) return "Loading semester tuition";
  return `${formatMoneyFromCents(amountCents)} semester`;
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

      <AcademyExplorer prefersReducedMotion={prefersReducedMotion} />

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
              Live BJJ enrollments are shown exactly as families register them, with full tuition for the current 13-week semester.
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
                    </div>
                    <div className="rounded-full border border-charcoal/10 bg-white/85 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.16em] text-charcoal/55 backdrop-blur">
                      {group.sessions.length} session{group.sessions.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-charcoal/8 bg-cream/45 px-4 py-3">
                    <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/45">{group.ageLabel}</div>
                    <div className="mt-2 font-heading text-lg text-charcoal">{activeSemesterLabel}</div>
                    <div className="mt-1 text-sm leading-relaxed text-charcoal/58">
                      {activeSemesterDescriptor} tuition shown below for each available enrollment.
                    </div>
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
