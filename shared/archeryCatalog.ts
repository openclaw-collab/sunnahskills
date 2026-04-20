export const ARCHERY_SERIES_PRICE_CENTS = 12500;
export const ARCHERY_SERIES_LABEL = "Four-session archery series";
export const ARCHERY_EYE_DOMINANCE_VIDEO_URL = "https://www.youtube.com/watch?v=zzotW5QE4gQ";

export const archeryEyeDominanceOptions = [
  { value: "right", label: "Right eye dominant" },
  { value: "left", label: "Left eye dominant" },
] as const;

export type ArcheryEyeDominance = (typeof archeryEyeDominanceOptions)[number]["value"];
