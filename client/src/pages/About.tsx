import { useState } from "react";
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

const milestones = [
  {
    key: "founding",
    label: "01 · Founding",
    title: "The Founding Vision",
    body: "Muadh and Mustafa came together with a shared vision: to create a martial arts school that would do more than teach self-defense. They wanted to build a place where young Muslims could develop character, confidence, and community — rooted in the Sunnah.",
  },
  {
    key: "bjj",
    label: "02 · May 2024",
    title: "First BJJ Classes Begin",
    body: "What began as a small BJJ class in a community center started to grow. Students began learning ground-based grappling techniques while developing patience, persistence, and problem-solving skills.",
  },
  {
    key: "archery",
    label: "03 · Summer 2024",
    title: "Traditional Archery Program",
    body: "Following the Sunnah of Prophet Muhammad ﷺ, we introduced traditional archery instruction. Students learn proper form, safety protocols, and mental focus while connecting with this ancient skill.",
  },
  {
    key: "outdoor",
    label: "04 · Fall 2024",
    title: "Outdoor Education Program",
    body: "Our comprehensive outdoor workshops began, teaching practical wilderness skills while fostering a deep connection with Allah's creation. Students gain confidence and environmental awareness.",
  },
  {
    key: "community",
    label: "05 · Today",
    title: "Thriving Community",
    body: "Our success isn't measured in trophies or belts — it's measured in the confident smiles of our students, the grateful feedback from parents, and the strong community we've built together.",
  },
];

const values = [
  {
    key: "character",
    num: "01",
    title: "Character First",
    desc: "We prioritize character development, teaching respect, discipline, and integrity in everything we do.",
  },
  {
    key: "safe",
    num: "02",
    title: "Safe Environment",
    desc: "Every child deserves to learn in a safe, supportive environment where they can grow without fear.",
  },
  {
    key: "skill",
    num: "03",
    title: "Skill Development",
    desc: "We teach practical skills that build confidence and provide real-world applications.",
  },
  {
    key: "community",
    num: "04",
    title: "Community Focus",
    desc: "We build strong communities where children learn to support and encourage each other.",
  },
];

const coaches = [
  {
    key: "ahmed",
    name: "Coach Ahmed",
    role: "BJJ Coach",
    bio: "Grew up training BJJ, passionate about youth mentorship.",
    achievements: "BJJ Brown Belt · Youth Instructor Certification",
    specialties: ["Grappling", "Self-Defence", "Confidence Building"],
    funFact: "Loves hiking and Turkish coffee.",
  },
  {
    key: "bilal",
    name: "Coach Bilal",
    role: "BJJ Coach",
    bio: "Started martial arts at 12, now helps teens build discipline.",
    achievements: "BJJ Purple Belt · First Aid Certified",
    specialties: ["Teen Development", "Competition Prep"],
    funFact: "Enjoys calligraphy and chess.",
  },
  {
    key: "fatima",
    name: "Coach Fatima",
    role: "BJJ Coach — Women & Girls",
    bio: "Focused on empowering girls and women through martial arts.",
    achievements: "BJJ Blue Belt · Women's Self-Defence Certified",
    specialties: ["Women's BJJ", "Confidence", "Community Building"],
    funFact: "Loves baking and archery.",
  },
  {
    key: "yusuf",
    name: "Coach Yusuf",
    role: "Archery Coach",
    bio: "Lifelong archer, passionate about teaching Sunnah archery.",
    achievements: "NASP Certified · 10+ years coaching youth",
    specialties: ["Traditional Archery", "Focus Training"],
    funFact: "Enjoys camping and poetry.",
  },
];

const reasons = [
  {
    key: "results",
    title: "Proven Results",
    desc: "Parents consistently report improved confidence, discipline, and academic performance after just a few months.",
  },
  {
    key: "islamic",
    title: "Islamic Values Integration",
    desc: "We seamlessly integrate Islamic principles of respect, discipline, and community service into every class.",
  },
  {
    key: "character",
    title: "Character Over Competition",
    desc: "Our focus is on building character, not just winning trophies.",
  },
  {
    key: "community",
    title: "Strong Muslim Community",
    desc: "Your child will train alongside other Muslim youth, building friendships and community bonds that last.",
  },
  {
    key: "scheduling",
    title: "Convenient Scheduling",
    desc: "Multiple class times and flexible programs designed to work with busy family schedules.",
  },
  {
    key: "comprehensive",
    title: "Comprehensive Development",
    desc: "From BJJ to archery to outdoor skills, we offer a complete program for physical, mental, and spiritual growth.",
  },
];

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
      {open && (
        <div className="mt-4 space-y-3 border-t border-charcoal/10 pt-4">
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
        </div>
      )}
    </PremiumCard>
  );
}

export default function About() {
  return (
    <div className="bg-cream min-h-screen pb-24">
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
              defaultText="We're not just teaching martial arts — we're building character, confidence, and community. Since May 2024, Sunnah Skills has been helping young Muslims develop the physical skills, mental discipline, and spiritual grounding they need to thrive."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </main>
      </StudioBlock>

      {/* TIMELINE */}
      <StudioBlock id="about.timeline" label="Our Journey" page="About">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <SectionHeader
            eyebrow={<StudioText k="about.timeline.eyebrow" defaultText="Our Journey" as="span" className="inline" />}
            title={<StudioText k="about.timeline.title" defaultText="A Timeline of Growth" as="span" className="inline" />}
            className="mb-12"
          />
          <div className="relative pl-6 border-l-2 border-charcoal/10 space-y-10">
            {milestones.map((m) => (
              <div key={m.key} className="relative">
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-clay border-2 border-cream" />
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay mb-1">
                  <StudioText k={`about.timeline.${m.key}.label`} defaultText={m.label} as="span" className="inline" />
                </div>
                <div className="font-heading text-lg text-charcoal mb-1">
                  <StudioText k={`about.timeline.${m.key}.title`} defaultText={m.title} as="span" className="inline" />
                </div>
                <p className="font-body text-sm text-charcoal/70 max-w-2xl leading-relaxed">
                  <StudioText
                    k={`about.timeline.${m.key}.body`}
                    defaultText={m.body}
                    as="span"
                    className="inline"
                    multiline
                  />
                </p>
              </div>
            ))}
          </div>
        </section>
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
                defaultText="We don't just teach martial arts — we build character, confidence, and community."
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
        <section className="max-w-6xl mx-auto px-6 py-16">
          <SectionHeader
            eyebrow={<StudioText k="about.values.eyebrow" defaultText="Core Values" as="span" className="inline" />}
            title={<StudioText k="about.values.title" defaultText="Our Mission & Values" as="span" className="inline" />}
            className="mb-10"
          />
          <p className="font-body text-sm text-charcoal/60 max-w-2xl mb-10">
            <StudioText
              k="about.values.intro"
              defaultText="We're committed to developing well-rounded individuals who are confident, capable, and compassionate."
              as="span"
              className="inline"
              multiline
            />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <PremiumCard key={v.key} className="bg-white border border-charcoal/10">
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
            ))}
          </div>
        </section>
      </StudioBlock>

      {/* MEET THE COACHES */}
      <StudioBlock id="about.coaches" label="Meet the Coaches" page="About">
        <section className="max-w-6xl mx-auto px-6 py-16 bg-cream">
          <SectionHeader
            eyebrow={<StudioText k="about.coaches.eyebrow" defaultText="The Team" as="span" className="inline" />}
            title={<StudioText k="about.coaches.title" defaultText="Meet the Coaches" as="span" className="inline" />}
            className="mb-4"
          />
          <p className="font-body text-sm text-charcoal/60 max-w-2xl mb-10">
            <StudioText
              k="about.coaches.intro"
              defaultText="Our dedicated team brings years of experience, passion, and care to every class."
              as="span"
              className="inline"
              multiline
            />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coaches.map((c) => (
              <CoachCard key={c.key} coach={c} />
            ))}
          </div>
        </section>
      </StudioBlock>

      {/* WHY PARENTS CHOOSE */}
      <StudioBlock id="about.why" label="Why Parents Choose" page="About">
        <section className="max-w-6xl mx-auto px-6 py-16">
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
            {reasons.map((r) => (
              <PremiumCard key={r.key} className="bg-white border border-charcoal/10">
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
            ))}
          </div>
          <DarkCard className="rounded-3xl">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-4">
              <StudioText k="about.why.testimonial.eyebrow" defaultText="What Parents Say" as="span" className="inline" />
            </div>
            <blockquote className="font-serif-accent italic text-xl md:text-2xl text-cream/90">
                <StudioText
                  k="about.why.testimonial.quote"
                  defaultText={`"Sunnah Skills has transformed my son's confidence and discipline. The Islamic values integration makes all the difference."`}
                  as="span"
                  className="inline"
                  multiline
                />
            </blockquote>
            <p className="mt-4 font-mono-label text-[10px] uppercase tracking-[0.18em] text-cream/50">
              <StudioText
                k="about.why.testimonial.byline"
                defaultText="— Parent of 3 students"
                as="span"
                className="inline"
              />
            </p>
          </DarkCard>
        </section>
      </StudioBlock>

      {/* CTA */}
      <StudioBlock id="about.cta" label="CTA" page="About">
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/40 mb-4">
            <StudioText k="about.cta.locationsLabel" defaultText="Locations" as="span" className="inline" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 font-body text-sm text-charcoal/60 mb-12">
            <span>
              <StudioText
                k="about.cta.location.bjj"
                defaultText="BJJ & Most Programs — 918 Dundas St E"
                as="span"
                className="inline"
              />
            </span>
            <span>
              <StudioText
                k="about.cta.location.archery"
                defaultText="Archery — E.T. Seaton Range"
                as="span"
                className="inline"
              />
            </span>
            <span>
              <StudioText
                k="about.cta.location.outdoor"
                defaultText="Outdoor — Coming Soon"
                as="span"
                className="inline"
              />
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/programs">
              <ClayButton className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                View Our Programs
              </ClayButton>
            </Link>
            <Link href="/contact">
              <button
                type="button"
                className="px-8 py-3.5 rounded-full border border-charcoal/20 text-charcoal/70 text-[11px] font-mono-label uppercase tracking-[0.18em] hover:bg-charcoal hover:text-cream transition-colors"
              >
                Contact Us Today
              </button>
            </Link>
          </div>
        </section>
      </StudioBlock>
    </div>
  );
}
