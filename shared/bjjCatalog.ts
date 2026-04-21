export type BjjTrackKey =
  | "girls-5-10"
  | "boys-7-13"
  | "women-11-tue"
  | "women-11-thu"
  | "women-self-defense-2026-04-30"
  | "women-self-defense-2026-05-28"
  | "women-self-defense-2026-06-25"
  | "men-14";

export type BjjMarketingGroupKey = "girls" | "boys" | "women" | "men";

export type BjjTrackDescriptor = {
  key: BjjTrackKey;
  label: string;
  marketingGroup: BjjMarketingGroupKey;
  marketingLabel: string;
  ageLabel: string;
  scheduleLabel: string;
  registerLabel: string;
  isKids: boolean;
  minAge: number;
  maxAge: number | null;
  allowedGenders: readonly string[];
  meetingDays: readonly string[];
  meetingDates?: readonly string[];
  defaultPerClassCents: number;
  oneTimePriceCents?: number;
  sortOrder: number;
};

export const WOMEN_BJJ_WEEKLY_TRACKS = ["women-11-tue", "women-11-thu"] as const;
export const WOMEN_SELF_DEFENSE_TRACKS = [
  "women-self-defense-2026-04-30",
  "women-self-defense-2026-05-28",
  "women-self-defense-2026-06-25",
] as const;
export const WOMEN_SECOND_WEEKLY_CLASS_CENTS = 5000;
export const WOMEN_SELF_DEFENSE_PRICE_CENTS = 2500;

export const BJJ_TRACKS: readonly BjjTrackDescriptor[] = [
  {
    key: "girls-5-10",
    label: "Girls 5–10",
    marketingGroup: "girls",
    marketingLabel: "Girls 5–10",
    ageLabel: "Girls ages 5–10",
    scheduleLabel: "Tuesday 2:30 to 3:30 PM, Friday 10:00 to 11:00 AM",
    registerLabel: "Girls 5–10",
    isKids: true,
    minAge: 5,
    maxAge: 10,
    allowedGenders: ["female", "girl", "woman"],
    meetingDays: ["Tuesday", "Friday"],
    defaultPerClassCents: 1200,
    sortOrder: 1,
  },
  {
    key: "boys-7-13",
    label: "Boys 7–13",
    marketingGroup: "boys",
    marketingLabel: "Boys 7–13",
    ageLabel: "Boys ages 7–13",
    scheduleLabel: "Tuesday 2:30 to 3:30 PM, Friday 10:00 to 11:00 AM",
    registerLabel: "Boys 7–13",
    isKids: true,
    minAge: 7,
    maxAge: 13,
    allowedGenders: ["male", "boy", "man"],
    meetingDays: ["Tuesday", "Friday"],
    defaultPerClassCents: 1200,
    sortOrder: 2,
  },
  {
    key: "women-11-tue",
    label: "Teens+ Women 11+ Tuesday",
    marketingGroup: "women",
    marketingLabel: "Women 11+",
    ageLabel: "Women ages 11+",
    scheduleLabel: "Tuesday 12:30 to 2:00 PM",
    registerLabel: "Women 11+ Tuesday",
    isKids: false,
    minAge: 11,
    maxAge: null,
    allowedGenders: ["female", "girl", "woman"],
    meetingDays: ["Tuesday"],
    defaultPerClassCents: 2000,
    sortOrder: 3,
  },
  {
    key: "women-11-thu",
    label: "Teens+ Women 11+ Thursday",
    marketingGroup: "women",
    marketingLabel: "Women 11+",
    ageLabel: "Women ages 11+",
    scheduleLabel: "Thursday 8:00 to 9:30 PM",
    registerLabel: "Women 11+ Thursday",
    isKids: false,
    minAge: 11,
    maxAge: null,
    allowedGenders: ["female", "girl", "woman"],
    meetingDays: ["Thursday"],
    defaultPerClassCents: 2000,
    sortOrder: 4,
  },
  {
    key: "women-self-defense-2026-04-30",
    label: "Women Self-Defense — Apr 30",
    marketingGroup: "women",
    marketingLabel: "Women 11+",
    ageLabel: "Women ages 11+",
    scheduleLabel: "Thursday Apr 30, 2026 — last Thursday of the month",
    registerLabel: "Women Self-Defense — Apr 30",
    isKids: false,
    minAge: 11,
    maxAge: null,
    allowedGenders: ["female", "girl", "woman"],
    meetingDays: ["Thursday"],
    meetingDates: ["2026-04-30"],
    defaultPerClassCents: WOMEN_SELF_DEFENSE_PRICE_CENTS,
    oneTimePriceCents: WOMEN_SELF_DEFENSE_PRICE_CENTS,
    sortOrder: 5,
  },
  {
    key: "women-self-defense-2026-05-28",
    label: "Women Self-Defense — May 28",
    marketingGroup: "women",
    marketingLabel: "Women 11+",
    ageLabel: "Women ages 11+",
    scheduleLabel: "Thursday May 28, 2026 — last Thursday of the month",
    registerLabel: "Women Self-Defense — May 28",
    isKids: false,
    minAge: 11,
    maxAge: null,
    allowedGenders: ["female", "girl", "woman"],
    meetingDays: ["Thursday"],
    meetingDates: ["2026-05-28"],
    defaultPerClassCents: WOMEN_SELF_DEFENSE_PRICE_CENTS,
    oneTimePriceCents: WOMEN_SELF_DEFENSE_PRICE_CENTS,
    sortOrder: 6,
  },
  {
    key: "women-self-defense-2026-06-25",
    label: "Women Self-Defense — Jun 25",
    marketingGroup: "women",
    marketingLabel: "Women 11+",
    ageLabel: "Women ages 11+",
    scheduleLabel: "Thursday Jun 25, 2026 — last Thursday of the month",
    registerLabel: "Women Self-Defense — Jun 25",
    isKids: false,
    minAge: 11,
    maxAge: null,
    allowedGenders: ["female", "girl", "woman"],
    meetingDays: ["Thursday"],
    meetingDates: ["2026-06-25"],
    defaultPerClassCents: WOMEN_SELF_DEFENSE_PRICE_CENTS,
    oneTimePriceCents: WOMEN_SELF_DEFENSE_PRICE_CENTS,
    sortOrder: 7,
  },
  {
    key: "men-14",
    label: "Teens+ Men 14+",
    marketingGroup: "men",
    marketingLabel: "Men 14+",
    ageLabel: "Men ages 14+",
    scheduleLabel: "Friday 8:00 to 9:00 PM, Saturday 8:00 to 9:00 PM",
    registerLabel: "Men 14+",
    isKids: false,
    minAge: 14,
    maxAge: null,
    allowedGenders: ["male", "boy", "man"],
    meetingDays: ["Friday", "Saturday"],
    defaultPerClassCents: 1400,
    sortOrder: 8,
  },
] as const;

export const BJJ_TRACK_BY_KEY: Record<BjjTrackKey, BjjTrackDescriptor> = BJJ_TRACKS.reduce(
  (acc, track) => {
    acc[track.key] = track;
    return acc;
  },
  {} as Record<BjjTrackKey, BjjTrackDescriptor>,
);

export function isBjjTrackKey(value: string): value is BjjTrackKey {
  return value in BJJ_TRACK_BY_KEY;
}

export function isKidsBjjTrackKey(value: string) {
  return isBjjTrackKey(value) && BJJ_TRACK_BY_KEY[value].isKids;
}

export function isWomenWeeklyBjjTrack(value: string): value is (typeof WOMEN_BJJ_WEEKLY_TRACKS)[number] {
  return (WOMEN_BJJ_WEEKLY_TRACKS as readonly string[]).includes(value);
}

export function isWomenSelfDefenseBjjTrack(value: string): value is (typeof WOMEN_SELF_DEFENSE_TRACKS)[number] {
  return (WOMEN_SELF_DEFENSE_TRACKS as readonly string[]).includes(value);
}

export function isMediaWaiverExemptBjjTrack(value: string) {
  return isBjjTrackKey(value) && ["women", "girls"].includes(BJJ_TRACK_BY_KEY[value].marketingGroup);
}

export function normalizeGenderLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["female", "girl", "woman"].includes(normalized)) return "female";
  if (["male", "boy", "man"].includes(normalized)) return "male";
  return normalized;
}

export function isEligibleForBjjTrack(trackKey: string, age: number, gender: string) {
  if (!isBjjTrackKey(trackKey)) return false;
  const track = BJJ_TRACK_BY_KEY[trackKey];
  const normalizedGender = normalizeGenderLabel(gender);
  if (age < track.minAge) return false;
  if (track.maxAge != null && age > track.maxAge) return false;
  return track.allowedGenders.map(normalizeGenderLabel).includes(normalizedGender);
}

export type BjjMarketingGroup = {
  key: BjjMarketingGroupKey;
  label: string;
  ageLabel: string;
  sessions: Array<{
    trackKey: BjjTrackKey;
    label: string;
    scheduleLabel: string;
  }>;
};

export const BJJ_MARKETING_GROUPS: readonly BjjMarketingGroup[] = [
  {
    key: "girls",
    label: "Girls 5–10",
    ageLabel: "Girls ages 5–10",
    sessions: [
      {
        trackKey: "girls-5-10",
        label: "Girls 5–10",
        scheduleLabel: "Tuesday 2:30 to 3:30 PM, Friday 10:00 to 11:00 AM",
      },
    ],
  },
  {
    key: "boys",
    label: "Boys 7–13",
    ageLabel: "Boys ages 7–13",
    sessions: [
      {
        trackKey: "boys-7-13",
        label: "Boys 7–13",
        scheduleLabel: "Tuesday 2:30 to 3:30 PM, Friday 10:00 to 11:00 AM",
      },
    ],
  },
  {
    key: "women",
    label: "Women 11+",
    ageLabel: "Women ages 11+",
    sessions: [
      {
        trackKey: "women-11-tue",
        label: "Tuesday enrollment",
        scheduleLabel: "Tuesday 12:30 to 2:00 PM",
      },
      {
        trackKey: "women-11-thu",
        label: "Thursday enrollment",
        scheduleLabel: "Thursday 8:00 to 9:30 PM",
      },
      {
        trackKey: "women-self-defense-2026-04-30",
        label: "Self-defense — Apr 30",
        scheduleLabel: "Last Thursday of the month · Apr 30 · one-time $25 registration",
      },
      {
        trackKey: "women-self-defense-2026-05-28",
        label: "Self-defense — May 28",
        scheduleLabel: "Last Thursday of the month · May 28 · one-time $25 registration",
      },
      {
        trackKey: "women-self-defense-2026-06-25",
        label: "Self-defense — Jun 25",
        scheduleLabel: "Last Thursday of the month · Jun 25 · one-time $25 registration",
      },
    ],
  },
  {
    key: "men",
    label: "Men 14+",
    ageLabel: "Men ages 14+",
    sessions: [
      {
        trackKey: "men-14",
        label: "Men 14+",
        scheduleLabel: "Friday 8:00 to 9:00 PM, Saturday 8:00 to 9:00 PM",
      },
    ],
  },
] as const;
