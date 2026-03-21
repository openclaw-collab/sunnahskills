export type ProgramSlug = "bjj" | "archery" | "outdoor" | "bullyproofing";

export type ProgramType = "recurring" | "seasonal" | "workshop" | "series";

export type ProgramConfig = {
  slug: ProgramSlug;
  name: string;
  type: ProgramType;
  ageRangeLabel: string;
  shortPitch: string;
  heroLead: string;
  highlights: string[];
  heroImage: {
    src: string;
    alt: string;
    objectPosition?: string;
  };
  registerPath: `/programs/${ProgramSlug}/register`;
  detailPath: `/programs/${ProgramSlug}`;
  pricingBlurb: string;
  scheduleBlurb: string;
  nextSteps: string[];
};

export const PROGRAMS: Record<ProgramSlug, ProgramConfig> = {
  bjj: {
    slug: "bjj",
    name: "Brazilian Jiu-Jitsu",
    type: "recurring",
    ageRangeLabel: "Youth + Teen Tracks",
    shortPitch: "Technique-first grappling that builds calm confidence, patience, and resilient character.",
    heroLead:
      "Ground-based training that teaches leverage, timing, and composure while helping students grow through steady progression.",
    highlights: ["Age-group tracks", "Technique over strength", "Belt progression", "Confidence under pressure"],
    heroImage: {
      src: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=2200&q=75",
      alt: "Youth Brazilian Jiu-Jitsu training on the mats",
      objectPosition: "center 30%",
    },
    registerPath: "/programs/bjj/register",
    detailPath: "/programs/bjj",
    pricingBlurb: "Monthly tuition plus an admin-editable registration fee where applicable.",
    scheduleBlurb: "Recurring weekly sessions organized by age and experience.",
    nextSteps: [
      "We confirm session placement by age and experience.",
      "Complete waivers and payment in the same flow.",
      "You’ll receive a confirmation and what-to-bring details.",
    ],
  },
  archery: {
    slug: "archery",
    name: "Traditional Archery",
    type: "seasonal",
    ageRangeLabel: "Youth + Teen (Seasonal)",
    shortPitch: "A Sunnah-rooted discipline for focus, patience, and precise form.",
    heroLead:
      "Seasonal sessions centered on breath, stance, safety, and the quiet repetition that builds skill and attention.",
    highlights: ["Seasonal sessions", "Safety-first range rules", "Traditional form", "Focus through repetition"],
    heroImage: {
      src: "https://images.unsplash.com/photo-1508896694512-1eade558679c?auto=format&fit=crop&w=2200&q=75",
      alt: "Traditional archery target and archer",
      objectPosition: "center 34%",
    },
    registerPath: "/programs/archery/register",
    detailPath: "/programs/archery",
    pricingBlurb: "Seasonal session pricing varies by age tier and schedule.",
    scheduleBlurb: "Seasonal sessions offered in limited windows.",
    nextSteps: [
      "Choose a session window and confirm equipment acknowledgement.",
      "Complete waivers and payment in-app.",
      "We’ll send session start details and safety notes.",
    ],
  },
  outdoor: {
    slug: "outdoor",
    name: "Outdoor Workshops",
    type: "workshop",
    ageRangeLabel: "Workshop Ages Vary",
    shortPitch: "Practical readiness training built around stewardship, problem-solving, and disciplined decision making.",
    heroLead:
      "Hands-on fieldcraft that teaches students to read conditions, work with tools, and move through the outdoors with confidence.",
    highlights: ["Workshop-based dates", "Stewardship mindset", "Navigation and shelter skills", "Real-world readiness"],
    heroImage: {
      src: "https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=2200&q=75",
      alt: "Forest trail and campfire-ready outdoor setting",
      objectPosition: "center 42%",
    },
    registerPath: "/programs/outdoor/register",
    detailPath: "/programs/outdoor",
    pricingBlurb: "One-time workshop fees are set per date in the admin panel.",
    scheduleBlurb: "Workshop dates are selected individually.",
    nextSteps: [
      "Select a workshop date and confirm gear/readiness checklist.",
      "Complete waivers and payment in-app.",
      "We’ll send location, timing, and gear details.",
    ],
  },
  bullyproofing: {
    slug: "bullyproofing",
    name: "Bullyproofing Workshops",
    type: "series",
    ageRangeLabel: "Ages 8–14 (Typical)",
    shortPitch: "Boundaries, awareness, and practical self-protection without aggression.",
    heroLead:
      "A short-series program that helps students respond with clarity, confidence, and calm when social pressure rises.",
    highlights: ["Verbal boundary setting", "Situational awareness", "Basic escape skills", "Confidence building"],
    heroImage: {
      src: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=2200&q=75",
      alt: "Confident youth in a training stance",
      objectPosition: "center 30%",
    },
    registerPath: "/programs/bullyproofing/register",
    detailPath: "/programs/bullyproofing",
    pricingBlurb: "Series pricing is set by cohort or workshop date.",
    scheduleBlurb: "Short-series dates are announced in advance.",
    nextSteps: [
      "Share any parent concerns to help instructors support the student.",
      "Complete waivers and payment in-app.",
      "We’ll send schedule details and what to expect.",
    ],
  },
};

export function getProgramConfig(slug: string): ProgramConfig | null {
  if (slug === "bjj" || slug === "archery" || slug === "outdoor" || slug === "bullyproofing") {
    return PROGRAMS[slug];
  }
  return null;
}

export function getProgramTypeLabel(type: ProgramType): string {
  switch (type) {
    case "recurring":
      return "Recurring Enrollment";
    case "seasonal":
      return "Seasonal Program";
    case "workshop":
      return "Workshop-Based";
    case "series":
      return "Short Series";
  }
}
