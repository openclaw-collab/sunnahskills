export type ProgramSlug = "bjj" | "archery" | "outdoor" | "bullyproofing";

export type ProgramType = "recurring" | "seasonal" | "workshop" | "series";

export type EnrollmentStatus = "open" | "coming_soon";

export type ProgramConfig = {
  slug: ProgramSlug;
  name: string;
  type: ProgramType;
  /** Only BJJ accepts live checkout; others show waitlist / contact flows. */
  enrollmentStatus: EnrollmentStatus;
  ageRangeLabel: string;
  shortPitch: string;
  heroLead: string;
  highlights: string[];
  overviewBullets: string[];
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
    enrollmentStatus: "open",
    ageRangeLabel: "Youth + Teen Tracks",
    shortPitch: "Technique-first grappling that builds calm confidence, patience, and resilient character.",
    heroLead:
      "Ground-based training that teaches leverage, timing, and composure while helping students grow through steady progression.",
    highlights: ["Age-group tracks", "Technique over strength", "Belt progression", "Confidence under pressure"],
    overviewBullets: [
      "Separate boys' and girls' classes",
      "Ages 6-17, grouped by age and skill level",
      "Belt progression system with regular testing",
      "Focus on respect, discipline, and character building",
    ],
    heroImage: {
      src: "/programs/bjj.png",
      alt: "Youth Brazilian Jiu-Jitsu training on the mats",
      objectPosition: "center 28%",
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
    enrollmentStatus: "coming_soon",
    ageRangeLabel: "Youth + Teen (Seasonal)",
    shortPitch: "A Sunnah-rooted discipline for focus, patience, and precise form.",
    heroLead:
      "Seasonal sessions centered on breath, stance, safety, and the quiet repetition that builds skill and attention.",
    highlights: ["Seasonal sessions", "Safety-first range rules", "Traditional form", "Focus through repetition"],
    overviewBullets: [
      "Summer and fall seasonal sessions",
      "Comprehensive safety training included",
      "Progressive skill development with traditional bows",
      "Mental focus and concentration training",
    ],
    heroImage: {
      src: "/programs/archery.png",
      alt: "Traditional archery target and archer",
      objectPosition: "left center",
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
    enrollmentStatus: "coming_soon",
    ageRangeLabel: "Workshop Ages Vary",
    shortPitch: "Practical readiness training built around stewardship, problem-solving, and disciplined decision making.",
    heroLead:
      "Hands-on fieldcraft that teaches students to read conditions, work with tools, and move through the outdoors with confidence.",
    highlights: ["Workshop-based dates", "Stewardship mindset", "Navigation and shelter skills", "Real-world readiness"],
    overviewBullets: [
      "Fire building techniques and safety",
      "Essential knot tying and rope work",
      "Shelter building and outdoor construction",
      "Navigation skills and orienteering",
    ],
    heroImage: {
      src: "/programs/outdoor.jpg",
      alt: "Forest trail and campfire-ready outdoor setting",
      objectPosition: "center 22%",
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
    enrollmentStatus: "coming_soon",
    ageRangeLabel: "Ages 8–14 (Typical)",
    shortPitch: "Boundaries, awareness, and practical self-protection without aggression.",
    heroLead:
      "A short-series program that helps students respond with clarity, confidence, and calm when social pressure rises.",
    highlights: ["Verbal boundary setting", "Situational awareness", "Basic escape skills", "Confidence building"],
    overviewBullets: [
      "Verbal boundary setting and assertiveness",
      "Situational awareness and threat recognition",
      "Basic grappling and distance control",
      "Confidence building and self-esteem development",
    ],
    heroImage: {
      src: "/programs/bully.jpeg",
      alt: "Confident youth in a training stance",
      objectPosition: "center 15%",
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
