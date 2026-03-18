export type ProgramSlug = "bjj" | "archery" | "outdoor" | "bullyproofing";

export type ProgramType = "recurring" | "seasonal" | "workshop" | "series";

export type ProgramConfig = {
  slug: ProgramSlug;
  name: string;
  type: ProgramType;
  ageRangeLabel: string;
  shortPitch: string;
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
    shortPitch: "Technique-first training that builds calm confidence and resilient character.",
    heroImage: {
      // Athlete training in gi; high contrast, reads well under gradient.
      src: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=2200&q=75",
      alt: "Brazilian Jiu-Jitsu training",
      objectPosition: "center 25%",
    },
    registerPath: "/programs/bjj/register",
    detailPath: "/programs/bjj",
    pricingBlurb: "Monthly tuition + optional one-time registration fee (admin-editable).",
    scheduleBlurb: "Recurring weekly sessions with age-group tracks.",
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
    shortPitch: "A Sunnah-rooted sport for focus, patience, and precise mechanics.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1509475826633-fed577a2c71b?auto=format&fit=crop&w=2200&q=75",
      alt: "Traditional archery target and bow",
      objectPosition: "center 35%",
    },
    registerPath: "/programs/archery/register",
    detailPath: "/programs/archery",
    pricingBlurb: "Seasonal session fee varies by age tier (admin-editable).",
    scheduleBlurb: "Seasonal sessions with multiple time windows.",
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
    shortPitch: "Readiness training: practical skills, stewardship, and disciplined decision making.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2200&q=75",
      alt: "Forest trail and outdoor landscape",
      objectPosition: "center 40%",
    },
    registerPath: "/programs/outdoor/register",
    detailPath: "/programs/outdoor",
    pricingBlurb: "One-time workshop fee per date (admin-editable).",
    scheduleBlurb: "Workshop-based; select a specific date.",
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
    shortPitch: "Boundaries, awareness, and practical protection—without aggression.",
    heroImage: {
      src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=2200&q=75",
      alt: "Confident youth portrait",
      objectPosition: "center 30%",
    },
    registerPath: "/programs/bullyproofing/register",
    detailPath: "/programs/bullyproofing",
    pricingBlurb: "One-time workshop/series fee (admin-editable).",
    scheduleBlurb: "Short-series workshops; dates vary.",
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

