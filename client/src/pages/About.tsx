import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionDiv, MotionPage, MotionSection } from "@/components/motion/PageMotion";

const milestones = [
  {
    key: "founding",
    label: "01 · Founding",
    title: "The Founding Vision",
    body: "Muadh and Mustafaa opened Sunnah Skills in May 2024 with a simple goal: teach BJJ to Muslim youth in a space that respects their values. Started with 5 kids in a rented community room.",
  },
  {
    key: "bjj",
    label: "02 · May 2024",
    title: "First BJJ Classes Begin",
    body: "Started with weekend boys' classes. By August, we had 15 regular students and added weekday sessions. Focus was on fundamentals: positions, escapes, and controlled sparring.",
  },
  {
    key: "archery",
    label: "03 · Summer 2024",
    title: "Traditional Archery Program",
    body: "Added archery at E.T. Seaton Park range. Small groups of 6-8 students per session. Learned stance, draw, and safety protocols with traditional recurve bows.",
  },
  {
    key: "women",
    label: "04 · Feb 2025",
    title: "First women's classes started",
    body: "Launched women-only BJJ in February 2025. Tuesday daytime and Thursday evening slots. Now runs 6-10 women per class with dedicated female-only mat space.",
  },
  {
    key: "girls",
    label: "05 · Oct 2025",
    title: "Girls classes began offering structured training",
    body: "Added girls' BJJ (ages 5-10) in October 2025. Runs parallel to women's classes so mothers and daughters can train at the same time. Currently 12 regular students.",
  },
  {
    key: "community",
    label: "06 · Today",
    title: "Where We Are Now",
    body: "30+ active students across 8 weekly classes. Four programs running: BJJ (kids, women, men), archery, and outdoor workshops in development. All at 918 Dundas St West, Mississauga.",
  },
];

const values = [
  {
    key: "character",
    num: "01",
    title: "Show Up Consistently",
    desc: "Progress comes from regular attendance and effort. We track attendance and celebrate milestones like stripe promotions and belt advancements.",
  },
  {
    key: "safe",
    num: "02",
    title: "Safety First",
    desc: "Every class starts with warm-ups and safety rules. No unsupervised sparring. All coaches are first aid certified. Parents receive emergency contact info.",
  },
  {
    key: "skill",
    num: "03",
    title: "Technique Over Strength",
    desc: "We teach leverage and positioning rather than relying on size or power. Small students learn to control larger opponents through proper form.",
  },
  {
    key: "community",
    num: "04",
    title: "Train Together",
    desc: "Classes are grouped by age and experience so students drill with appropriate partners. Women train with women, kids with kids of similar size.",
  },
];

const coaches = [
  {
    key: "mustafaa",
    name: "Mustafaa",
    role: "BJJ Coach for Men and Boys",
    bio: "Coaches the men's and boys' BJJ groups with a patient, practical style.",
    achievements: "Purple belt, 5+ years training, competitor, first aid certified",
    specialties: ["Men's BJJ", "Boys BJJ", "Competition Prep"],
    funFact: "Enjoys biking and snowboarding.",
  },
  {
    key: "muadh",
    name: "Muadh",
    role: "BJJ Coach for Men and Boys",
    bio: "Coaches the men's and boys' BJJ groups with a calm, detail-focused approach.",
    achievements: "Blue belt, 5+ years training, competitor, first aid certified",
    specialties: ["Men's BJJ", "Boys BJJ", "Fundamentals"],
    funFact: "Enjoys hiking and coding.",
  },
  {
    key: "ibraheem",
    name: "Ibraheem Gaied",
    role: "Archery Instructor",
    bio: "Former president and head coach of the UofT Scarborough Archery Club who has coached hundreds of children, post-secondary students, and corporate teams.",
    achievements: "UTSC Athletics leadership award, beginner archer instruction certification (2019), former UTSC archery president/head coach (2018-2023)",
    specialties: ["Traditional Archery", "Beginner Coaching", "Youth Programs"],
    funFact: "Has built archery programs with Camp UofT and The Manhood Muslim youth program.",
  },
];

const reasons = [
  {
    key: "results",
    title: "Clear Progression",
    desc: "Students earn stripes every 8-12 weeks and belts every 1-2 years. Parents receive progress updates and know exactly what their child is working on.",
  },
  {
    key: "islamic",
    title: "Prayer Times Built In",
    desc: "Asr prayer is scheduled into longer classes. Separate women's classes with hijabi-friendly uniforms. No music during training.",
  },
  {
    key: "character",
    title: "No Competition Pressure",
    desc: "We don't push tournaments. Students can compete if they want, but most train for fitness, self-defense, and personal growth without competitive stress.",
  },
  {
    key: "community",
    title: "Same Faces Every Week",
    desc: "Small class sizes (8-15 students) mean consistent training partners. Students build actual friendships, not just gym acquaintances.",
  },
  {
    key: "scheduling",
    title: "Family-Friendly Times",
    desc: "Women's and girls' classes run simultaneously so mothers and daughters can train together. Evening and weekend options for working parents.",
  },
  {
    key: "comprehensive",
    title: "Multiple Disciplines",
    desc: "Students can train BJJ year-round, add archery in summer, and outdoor skills workshops when offered. One account manages all programs.",
  },
];

function TimelineCard({
  milestone,
  side,
}: {
  milestone: (typeof milestones)[number];
  side: "left" | "right";
}) {
  const alignRight = side === "left";

  return (
    <PremiumCard
      className={`bg-white border border-charcoal/10 max-w-xl ${
        alignRight ? "lg:ml-auto lg:text-right" : "lg:mr-auto"
      }`}
    >
      <div className={`font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay mb-1 ${alignRight ? "lg:justify-end" : ""}`}>
        <StudioText k={`about.timeline.${milestone.key}.label`} defaultText={milestone.label} as="span" className="inline" />
      </div>
      <div className="font-heading text-lg text-charcoal mb-2">
        <StudioText k={`about.timeline.${milestone.key}.title`} defaultText={milestone.title} as="span" className="inline" />
      </div>
      <p className="font-body text-sm text-charcoal/70 leading-relaxed">
        <StudioText
          k={`about.timeline.${milestone.key}.body`}
          defaultText={milestone.body}
          as="span"
          className="inline"
          multiline
        />
      </p>
    </PremiumCard>
  );
}

function TimelineItem({
  milestone,
  index,
  reduceMotion,
}: {
  milestone: (typeof milestones)[number];
  index: number;
  reduceMotion: boolean;
}) {
  const leftSide = index % 2 === 0;

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-start gap-4 lg:gap-6"
      initial={{ opacity: 0, y: 18, x: reduceMotion ? 0 : leftSide ? -18 : 18 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
    >
      <div className={leftSide ? "lg:pr-2" : "lg:col-start-1 lg:pr-2"}>
        {leftSide ? <TimelineCard milestone={milestone} side="left" /> : null}
      </div>

      <div className="relative hidden items-start justify-start lg:flex lg:justify-center">
        <div className="absolute left-5 top-0 h-full w-px bg-charcoal/10 lg:left-1/2 lg:-translate-x-1/2" />
        <span className="relative z-10 mt-2 flex h-4 w-4 items-center justify-center rounded-full border border-clay/30 bg-cream shadow-sm">
          <span className="h-2 w-2 rounded-full bg-clay" />
        </span>
      </div>

      <div className={leftSide ? "lg:col-start-3 lg:pl-2" : "lg:pl-2"}>
        {!leftSide ? <TimelineCard milestone={milestone} side="right" /> : null}
      </div>
    </motion.div>
  );
}

function CoachCard({ coach }: { coach: (typeof coaches)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-heading text-xl text-charcoal">
            <StudioText
              k={`about.coaches.card.${coach.key}.name`}
              defaultText={coach.name}
              as="span"
              className="inline"
            />
          </div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mt-1">
            <StudioText
              k={`about.coaches.card.${coach.key}.role`}
              defaultText={coach.role}
              as="span"
              className="inline"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50 hover:text-clay transition-colors"
        >
          {open ? "Less ↑" : "More ↓"}
        </button>
      </div>
      <p className="mt-3 font-body text-sm text-charcoal/70">
        <StudioText
          k={`about.coaches.card.${coach.key}.bio`}
          defaultText={coach.bio}
          as="span"
          className="inline"
          multiline
        />
      </p>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 space-y-3 border-t border-charcoal/10 pt-4 overflow-hidden"
          >
            <div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/40 mb-1">
                <StudioText
                  k={`about.coaches.card.${coach.key}.achievementsLabel`}
                  defaultText="Achievements"
                  as="span"
                  className="inline"
                />
              </div>
              <p className="font-body text-xs text-charcoal/70">
                <StudioText
                  k={`about.coaches.card.${coach.key}.achievements`}
                  defaultText={coach.achievements}
                  as="span"
                  className="inline"
                  multiline
                />
              </p>
            </div>
            <div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/40 mb-1">
                <StudioText
                  k={`about.coaches.card.${coach.key}.specialtiesLabel`}
                  defaultText="Specialties"
                  as="span"
                  className="inline"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {coach.specialties.map((s, i) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full border border-charcoal/10 px-2 py-1 text-[10px] font-mono-label uppercase tracking-[0.12em] text-charcoal/60"
                  >
                    <StudioText
                      k={`about.coaches.card.${coach.key}.specialties.${i}`}
                      defaultText={s}
                      as="span"
                      className="inline"
                    />
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/40 mb-1">
                <StudioText
                  k={`about.coaches.card.${coach.key}.funFactLabel`}
                  defaultText="Fun Fact"
                  as="span"
                  className="inline"
                />
              </div>
              <p className="font-body text-xs text-charcoal/60 italic">
                <StudioText
                  k={`about.coaches.card.${coach.key}.funFact`}
                  defaultText={coach.funFact}
                  as="span"
                  className="inline"
                  multiline
                />
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PremiumCard>
  );
}

export default function About() {
  const reduceMotion = useReducedMotion();

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />

      {/* PAGE HEADER */}
      <StudioBlock id="about.header" label="Header" page="About">
        <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
          <SectionHeader
            eyebrow={<StudioText k="about.header.eyebrow" defaultText="About the Academy" as="span" className="inline" />}
            title={<StudioText k="about.header.title" defaultText="The Sunnah Skills Philosophy" as="span" className="inline" />}
            className="mb-6"
          />
          <p className="font-body text-sm text-charcoal/70 max-w-2xl leading-relaxed">
            <StudioText
              k="about.header.intro"
              defaultText="We teach martial arts as a way to build practical skills and character. Since May 2024, we've helped students show up consistently, train with discipline, and apply what they learn at home."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </main>
      </StudioBlock>

      {/* TIMELINE */}
      <StudioBlock id="about.timeline" label="Our Journey" page="About">
        <MotionSection className="max-w-6xl mx-auto px-6 py-16">
          <SectionHeader
            eyebrow={<StudioText k="about.timeline.eyebrow" defaultText="Our Journey" as="span" className="inline" />}
            title={<StudioText k="about.timeline.title" defaultText="A Timeline of Growth" as="span" className="inline" />}
            className="mb-12"
          />
          <div className="relative">
            <motion.div
              className="absolute left-5 top-0 h-full w-px bg-charcoal/10 lg:left-1/2 lg:-translate-x-1/2"
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "top" }}
            />
            <div className="space-y-8 lg:space-y-10">
              {milestones.map((m, index) => (
                <TimelineItem key={m.key} milestone={m} index={index} reduceMotion={!!reduceMotion} />
              ))}
            </div>
          </div>
        </MotionSection>
      </StudioBlock>

      {/* PROMISE QUOTE */}
      <StudioBlock id="about.promise" label="Our Promise" page="About">
        <div className="mx-2 md:mx-6 my-4">
          <DarkCard className="rounded-[3rem] py-16 px-8 md:px-16 text-center">
            <div className="font-mono-label text-[11px] uppercase tracking-[0.25em] text-moss mb-8">
              <StudioText k="about.promise.eyebrow" defaultText="Our Promise" as="span" className="inline" />
            </div>
            <blockquote className="font-serif-accent italic text-3xl md:text-5xl text-cream leading-tight max-w-3xl mx-auto">
              <StudioText
                k="about.promise.quote"
                defaultText="Our students learn technique. But they also learn to show up, work with others, and stay calm under pressure."
                as="span"
                className="inline"
                multiline
              />
            </blockquote>
            <p className="mt-8 font-body text-sm text-cream/60 max-w-lg mx-auto">
              <StudioText
                k="about.promise.subcopy"
                defaultText="Every child deserves to discover their strength, both physical and spiritual."
                as="span"
                className="inline"
                multiline
              />
            </p>
          </DarkCard>
        </div>
      </StudioBlock>

      {/* MISSION & VALUES */}
      <StudioBlock id="about.values" label="Mission & Values" page="About">
        <MotionSection className="max-w-6xl mx-auto px-6 py-16">
          <SectionHeader
            eyebrow={<StudioText k="about.values.eyebrow" defaultText="Core Values" as="span" className="inline" />}
            title={<StudioText k="about.values.title" defaultText="Our Mission & Values" as="span" className="inline" />}
            className="mb-10"
          />
          <p className="font-body text-sm text-charcoal/60 max-w-2xl mb-10">
            <StudioText
              k="about.values.intro"
              defaultText="We want students to leave class with better technique than when they arrived—and better habits too."
              as="span"
              className="inline"
              multiline
            />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, index) => (
              <MotionDiv key={v.key} delay={index * 0.04}>
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay mb-3">
                    <StudioText k={`about.values.${v.key}.num`} defaultText={v.num} as="span" className="inline" />
                  </div>
                  <div className="font-heading text-xl text-charcoal mb-2">
                    <StudioText k={`about.values.${v.key}.title`} defaultText={v.title} as="span" className="inline" />
                  </div>
                  <p className="font-body text-sm text-charcoal/70 leading-relaxed">
                    <StudioText
                      k={`about.values.${v.key}.desc`}
                      defaultText={v.desc}
                      as="span"
                      className="inline"
                      multiline
                    />
                  </p>
                </PremiumCard>
              </MotionDiv>
            ))}
          </div>
        </MotionSection>
      </StudioBlock>

      {/* MEET THE COACHES */}
      <StudioBlock id="about.coaches" label="Meet the Coaches" page="About">
        <MotionSection className="max-w-6xl mx-auto px-6 py-16 bg-cream">
          <SectionHeader
            eyebrow={<StudioText k="about.coaches.eyebrow" defaultText="The Team" as="span" className="inline" />}
            title={<StudioText k="about.coaches.title" defaultText="Meet the Coaches" as="span" className="inline" />}
            className="mb-4"
          />
          <p className="font-body text-sm text-charcoal/60 max-w-2xl mb-10">
            <StudioText
              k="about.coaches.intro"
              defaultText="Mustafaa and Muadh are purple and blue belt practitioners who have coached together since 2024."
              as="span"
              className="inline"
              multiline
            />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coaches.map((c, index) => (
              <MotionDiv key={c.key} delay={index * 0.04}>
                <CoachCard coach={c} />
              </MotionDiv>
            ))}
          </div>
        </MotionSection>
      </StudioBlock>

      {/* WHY PARENTS CHOOSE */}
      <StudioBlock id="about.why" label="Why Parents Choose" page="About">
        <MotionSection className="max-w-6xl mx-auto px-6 py-16">
          <SectionHeader
            eyebrow={<StudioText k="about.why.eyebrow" defaultText="Why Us" as="span" className="inline" />}
            title={<StudioText k="about.why.title" defaultText="Why Parents Choose Sunnah Skills" as="span" className="inline" />}
            className="mb-4"
          />
          <p className="font-body text-sm text-charcoal/60 max-w-2xl mb-10">
            <StudioText
              k="about.why.intro"
              defaultText="Discover what makes us different from other martial arts schools."
              as="span"
              className="inline"
              multiline
            />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {reasons.map((r, index) => (
              <MotionDiv key={r.key} delay={index * 0.04}>
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="font-heading text-base text-charcoal mb-2">
                    <StudioText k={`about.why.${r.key}.title`} defaultText={r.title} as="span" className="inline" />
                  </div>
                  <p className="font-body text-sm text-charcoal/70 leading-relaxed">
                    <StudioText
                      k={`about.why.${r.key}.desc`}
                      defaultText={r.desc}
                      as="span"
                      className="inline"
                      multiline
                    />
                  </p>
                </PremiumCard>
              </MotionDiv>
            ))}
          </div>
          <DarkCard className="rounded-3xl">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-4">
              <StudioText k="about.why.testimonial.eyebrow" defaultText="What Parents Say" as="span" className="inline" />
            </div>
            <blockquote className="font-serif-accent italic text-xl md:text-2xl text-cream/90">
                <StudioText
                  k="about.why.testimonial.quote"
                  defaultText={`"My son listens better at home now. The coaches reference Islamic adab naturally, not forced."`}
                  as="span"
                  className="inline"
                  multiline
                />
            </blockquote>
            <p className="mt-4 font-mono-label text-[10px] uppercase tracking-[0.18em] text-cream/50">
              <StudioText
                k="about.why.testimonial.byline"
                defaultText="Parent of 3 students"
                as="span"
                className="inline"
              />
            </p>
          </DarkCard>
        </MotionSection>
      </StudioBlock>

      {/* CTA */}
      <StudioBlock id="about.cta" label="CTA" page="About">
        <MotionSection className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/40 mb-4">
            <StudioText k="about.cta.locationsLabel" defaultText="Locations" as="span" className="inline" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 font-body text-sm text-charcoal/60 mb-12">
            <span>
              <StudioText
                k="about.cta.location.bjj"
                defaultText="BJJ and most programs, 918 Dundas St E"
                as="span"
                className="inline"
              />
            </span>
            <span>
              <StudioText
                k="about.cta.location.archery"
                defaultText="Archery, E.T. Seaton Range"
                as="span"
                className="inline"
              />
            </span>
            <span>
              <StudioText
                k="about.cta.location.outdoor"
                defaultText="Outdoor, coming soon"
                as="span"
                className="inline"
              />
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ClayButton asChild className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/programs">View Our Programs</Link>
            </ClayButton>
            <Link
              href="/contact"
              className="px-8 py-3.5 rounded-full border border-charcoal/20 text-charcoal/70 text-[11px] font-mono-label uppercase tracking-[0.18em] hover:bg-charcoal hover:text-cream transition-colors"
            >
              Contact Us Today
            </Link>
          </div>
        </MotionSection>
      </StudioBlock>
    </MotionPage>
  );
}
