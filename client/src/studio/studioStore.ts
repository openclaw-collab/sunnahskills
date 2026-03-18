import type { StudioState, StudioThemePreset, StudioThemePresetId } from "./studioTypes";

const STORAGE_KEY = "sunnahskills:studio:v1";

export const STUDIO_THEME_PRESETS: StudioThemePreset[] = [
  {
    id: "brand",
    label: "Brand (Cream/Moss/Clay)",
    vars: {
      "--background": "#F2F0E9",
      "--foreground": "#1A1A1A",
      "--primary": "#2E4036",
      "--accent": "#CC5833",
      "--muted": "#E4DED0",
    },
  },
  {
    id: "sage",
    label: "Sage (Cooler Moss)",
    vars: {
      "--background": "#F3F2EC",
      "--foreground": "#151515",
      "--primary": "#244037",
      "--accent": "#B64B2A",
      "--muted": "#E8E2D6",
    },
  },
  {
    id: "ink",
    label: "Ink (Darker Charcoal)",
    vars: {
      "--background": "#EFECE4",
      "--foreground": "#0E0E0E",
      "--primary": "#22352D",
      "--accent": "#D0643C",
      "--muted": "#E4DDCF",
    },
  },
  {
    id: "clay",
    label: "Clay (Warmer Accent)",
    vars: {
      "--background": "#F4F1E8",
      "--foreground": "#171717",
      "--primary": "#2B3E34",
      "--accent": "#D66A41",
      "--muted": "#E8E0D1",
    },
  },
];

export function defaultStudioState(): StudioState {
  return {
    enabled: false,
    themePresetId: "brand",
    edits: {},
    comments: {},
  };
}

export function loadStudioState(): StudioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStudioState();
    const parsed = JSON.parse(raw) as StudioState;
    return {
      ...defaultStudioState(),
      ...parsed,
      edits: parsed.edits ?? {},
      comments: parsed.comments ?? {},
    };
  } catch {
    return defaultStudioState();
  }
}

export function saveStudioState(state: StudioState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function applyThemePreset(presetId: StudioThemePresetId) {
  const preset = STUDIO_THEME_PRESETS.find((p) => p.id === presetId) ?? STUDIO_THEME_PRESETS[0];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(preset.vars)) {
    if (typeof v === "string") root.style.setProperty(k, v);
  }
}

