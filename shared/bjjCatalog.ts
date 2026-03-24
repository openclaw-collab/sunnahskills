export type BjjTrackKey =
  | "girls-5-10"
  | "boys-7-13"
  | "women-11-tue"
  | "women-11-thu"
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
  defaultPerClassCents: number;
  sortOrder: number;
};

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
    sortOrder: 5,
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
