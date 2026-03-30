import { BJJ_TRACKS } from "./bjjCatalog";

export const guardianRelationshipOptions = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Legal Guardian" },
  { value: "other", label: "Other" },
] as const;

export const studentGenderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
] as const;

export const studentSkillLevelOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "some", label: "Some experience" },
  { value: "intermediate", label: "Intermediate" },
] as const;

/** BJJ track keys align with `program_sessions.age_group` / pricing rows (merged plan). */
export const bjjTrackOptions = BJJ_TRACKS.map((track) => ({
  value: track.key,
  label: track.label,
})) as ReadonlyArray<{ value: (typeof BJJ_TRACKS)[number]["key"]; label: string }>;

export const bjjTrialClassOptions = [
  { value: "yes", label: "Yes, trial class first" },
  { value: "no", label: "No, enrol directly" },
] as const;

export const archeryDominantHandOptions = [
  { value: "right", label: "Right-handed" },
  { value: "left", label: "Left-handed" },
] as const;

export const archeryExperienceOptions = [
  { value: "never", label: "Never tried" },
  { value: "some", label: "Some experience" },
  { value: "practiced", label: "Practiced before" },
] as const;

export const archerySessionOptions = [
  { value: "summer-2026-a", label: "Summer 2026 — Session A (Jul 7 – Jul 25)" },
  { value: "summer-2026-b", label: "Summer 2026 — Session B (Aug 4 – Aug 22)" },
  { value: "fall-2026", label: "Fall 2026 — Session (Sep 8 – Oct 17)" },
] as const;

export const outdoorWorkshopDateOptions = [
  { value: "2026-04-12", label: "April 12, 2026 — Morning session" },
  { value: "2026-04-26", label: "April 26, 2026 — Morning session" },
  { value: "2026-05-10", label: "May 10, 2026 — Morning session" },
  { value: "2026-05-24", label: "May 24, 2026 — Morning session" },
] as const;

export const outdoorGearOptions = [
  { value: "boots", label: "Sturdy, closed-toe boots" },
  { value: "rain-gear", label: "Rain gear / waterproof layer" },
  { value: "water-bottle", label: "Water bottle (1L+)" },
  { value: "sun-protection", label: "Sun protection (hat + sunscreen)" },
] as const;

export const bullyproofingConcernOptions = [
  { value: "being-bullied", label: "Being bullied" },
  { value: "exhibiting", label: "Exhibiting bullying behaviour" },
  { value: "confidence", label: "General confidence building" },
] as const;

export const bullyproofingAgeGroupOptions = [
  { value: "6-9", label: "6–9 yrs" },
  { value: "10-13", label: "10–13 yrs" },
  { value: "14+", label: "14+ yrs" },
] as const;
