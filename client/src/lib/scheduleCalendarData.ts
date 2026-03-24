/**
 * Normalized schedule rows aligned with D1 seed / merged plan §1.
 * Used by Schedule.tsx week time-grid + month recurring chips.
 */

export type ProgramSlug = "bjj" | "archery" | "outdoor" | "bullyproofing";

export type ScheduleTrack = "kids" | "women" | "men" | "other";

export type NormalizedSession = {
  id: string;
  /** 0 = Sunday … 6 = Saturday */
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  label: string;
  shortLabel: string;
  track: ScheduleTrack;
  slug: ProgramSlug;
  /** BJJ is live; others are waitlist / detail */
  registerable: boolean;
};

const M = (h: number, min: number) => h * 60 + min;

/** Authoritative BJJ weekly sessions (local times). */
export const NORMALIZED_SESSIONS: NormalizedSession[] = [
  {
    id: "girls-fri",
    dayIndex: 5,
    startMinutes: M(10, 0),
    endMinutes: M(11, 0),
    label: "Girls 5–10 BJJ",
    shortLabel: "Girls BJJ",
    track: "kids",
    slug: "bjj",
    registerable: true,
  },
  {
    id: "girls-tue",
    dayIndex: 2,
    startMinutes: M(14, 30),
    endMinutes: M(15, 30),
    label: "Girls 5–10 BJJ, after the women block in a different room",
    shortLabel: "Girls BJJ",
    track: "kids",
    slug: "bjj",
    registerable: true,
  },
  {
    id: "boys-fri",
    dayIndex: 5,
    startMinutes: M(10, 0),
    endMinutes: M(11, 0),
    label: "Boys 7–13 BJJ",
    shortLabel: "Boys BJJ",
    track: "kids",
    slug: "bjj",
    registerable: true,
  },
  {
    id: "boys-tue",
    dayIndex: 2,
    startMinutes: M(14, 30),
    endMinutes: M(15, 30),
    label: "Boys 7–13 BJJ, after the women block in a different room",
    shortLabel: "Boys BJJ",
    track: "kids",
    slug: "bjj",
    registerable: true,
  },
  {
    id: "women-tue",
    dayIndex: 2,
    startMinutes: M(12, 30),
    endMinutes: M(14, 0),
    label: "Teens+ Women 11+ Tuesday, 1.5 hr",
    shortLabel: "Women Tue",
    track: "women",
    slug: "bjj",
    registerable: true,
  },
  {
    id: "women-thu",
    dayIndex: 4,
    startMinutes: M(20, 0),
    endMinutes: M(21, 30),
    label: "Teens+ Women 11+ Thursday, 1.5 hr",
    shortLabel: "Women Thu",
    track: "women",
    slug: "bjj",
    registerable: true,
  },
  {
    id: "men-fri",
    dayIndex: 5,
    startMinutes: M(20, 0),
    endMinutes: M(21, 0),
    label: "Teens+ Men 14+ Friday",
    shortLabel: "Men Fri",
    track: "men",
    slug: "bjj",
    registerable: true,
  },
  {
    id: "men-sat",
    dayIndex: 6,
    startMinutes: M(20, 0),
    endMinutes: M(21, 0),
    label: "Teens+ Men 14+ Saturday",
    shortLabel: "Men Sat",
    track: "men",
    slug: "bjj",
    registerable: true,
  },
];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Vertical axis: 8:00 – 22:00 for positioning blocks */
export const GRID_START_MIN = M(8, 0);
export const GRID_END_MIN = M(22, 0);
export const GRID_RANGE = GRID_END_MIN - GRID_START_MIN;

export function minutesToTopPct(start: number) {
  return ((start - GRID_START_MIN) / GRID_RANGE) * 100;
}

export function minutesToHeightPct(start: number, end: number) {
  return ((end - start) / GRID_RANGE) * 100;
}

export function formatTime12(mins: number) {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function registerHrefForSession(s: NormalizedSession) {
  if (!s.registerable) return `/programs/${s.slug}`;
  return `/programs/${s.slug}/register`;
}
