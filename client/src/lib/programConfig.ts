export type ProgramSlug = "bjj" | "archery" | "outdoor" | "bullyproofing" | "swimming" | "horseback";

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
    ageRangeLabel: "Girls 5–10 · Boys 7–13 · Women 11+ · Men 14+",
    shortPitch: "Ground-based training that teaches leverage and timing. Students learn to stay composed under pressure.",
    heroLead:
      "Ground-based training that teaches leverage, timing, and composure while helping students grow through steady progression.",
    highlights: ["Age-group tracks", "Technique over strength", "Belt progression", "Confidence under pressure"],
    overviewBullets: [
      "Girls 5–10 and Boys 7–13 train Tuesday 2:30-3:30 PM and Friday 10:00-11:00 AM",
      "Women 11+ choose Tuesday 12:30-2:00 PM OR Thursday 8:00-9:30 PM (or both)",
      "Men 14+ train Friday 8:00-9:00 PM and Saturday 8:00-9:00 PM",
      "All sessions at 918 Dundas St. West, Mississauga",
    ],
    heroImage: {
      src: "/programs/bjj.png",
      alt: "Youth Brazilian Jiu-Jitsu training on the mats",
      objectPosition: "center 28%",
    },
    registerPath: "/programs/bjj/register",
    detailPath: "/programs/bjj",
    pricingBlurb: "Kids tuition follows semester math from admin pricing; women and men tracks use admin-set live rates.",
    scheduleBlurb: "Tuesday / Friday youth, Tuesday / Thursday women, Friday / Saturday men.",
    nextSteps: [
      "Open your Family & Member Account before registration.",
      "Choose the exact BJJ track and session that matches the student.",
      "Complete waivers and payment in the same authenticated flow.",
    ],
  },
  archery: {
    slug: "archery",
    name: "Traditional Archery",
    type: "seasonal",
    enrollmentStatus: "coming_soon",
    ageRangeLabel: "Youth + Teen (Seasonal)",
    shortPitch: "Traditional archery emphasizing stance, anchor, and release. Students learn to slow down and shoot consistently.",
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
    shortPitch: "Learn fire building, shelter construction, and navigation in real outdoor settings. Students leave with practical skills they can use on family camping trips.",
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
    shortPitch: "Verbal boundary-setting first, then escape skills if needed. No aggressive techniques—just practical responses to real situations.",
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
  swimming: {
    slug: "swimming",
    name: "Swimming",
    type: "seasonal",
    enrollmentStatus: "coming_soon",
    ageRangeLabel: "Youth + Family",
    shortPitch: "Kids get comfortable in the water first. Safety habits and strokes follow once they're ready.",
    heroLead:
      "A calm swimming program that builds comfort in the water first, then technique—at whatever pace each child needs.",
    highlights: ["Comfort before technique", "Small groups", "Foundational strokes", "Coaching that matches each child's pace"],
    overviewBullets: [
      "Youth and family sessions opening soon",
      "Safety habits built into every lesson",
      "Breath control and stroke basics",
      "Progress at the child's own pace—no rushing",
    ],
    heroImage: {
      src: "/programs/swimming.jpg",
      alt: "Swimmers in a pool training session",
      objectPosition: "center 35%",
    },
    registerPath: "/programs/swimming/register",
    detailPath: "/programs/swimming",
    pricingBlurb: "Swimming pricing will be announced when enrollment opens.",
    scheduleBlurb: "Coming soon.",
    nextSteps: [
      "Join the waitlist to hear when swimming opens.",
      "We’ll share age groups, session times, and pricing first.",
      "Follow along for launch updates and safety details.",
    ],
  },
  horseback: {
    slug: "horseback",
    name: "Horseback Riding",
    type: "seasonal",
    enrollmentStatus: "coming_soon",
    ageRangeLabel: "Youth + Family",
    shortPitch: "Beginners learn to sit well, move calmly, and handle horses with care—close supervision the whole time.",
    heroLead:
      "Horseback sessions for beginners: good posture, calm movements, and learning to care for horses in a supervised setting.",
    highlights: ["Sitting and balance", "Calm, careful approach", "Beginners welcome", "Close supervision throughout"],
    overviewBullets: [
      "Youth and family sessions opening soon",
      "Basic horse handling and stable safety",
      "Balance, posture, and calm confidence",
      "Care-focused instruction in a supervised setting",
    ],
    heroImage: {
      src: "/programs/horseback.jpg",
      alt: "Horseback riding training",
      objectPosition: "center 30%",
    },
    registerPath: "/programs/horseback/register",
    detailPath: "/programs/horseback",
    pricingBlurb: "Horseback pricing will be announced when enrollment opens.",
    scheduleBlurb: "Coming soon.",
    nextSteps: [
      "Join the waitlist to hear when horseback opens.",
      "We’ll share age groups, session times, and pricing first.",
      "Follow along for launch updates and safety details.",
    ],
  },
};

export function getProgramConfig(slug: string): ProgramConfig | null {
  if (slug === "bjj" || slug === "archery" || slug === "outdoor" || slug === "bullyproofing" || slug === "swimming" || slug === "horseback") {
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
