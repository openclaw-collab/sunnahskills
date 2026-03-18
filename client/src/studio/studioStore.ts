import type { StudioCustomTheme, StudioState, StudioThemePreset, StudioThemePresetId } from "./studioTypes";

const STORAGE_KEY = "sunnahskills:studio:v2";

export const DEFAULT_CUSTOM_THEME: StudioCustomTheme = {
  background: "#F2F0E9",
  subtheme1: "#2E4036",
  highlight: "#CC5833",
};

export const STUDIO_THEME_PRESETS: StudioThemePreset[] = [
  {
    id: "brand",
    label: "Brand",
    base: { background: "#F2F0E9", subtheme1: "#2E4036", highlight: "#CC5833" },
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
    label: "Sage",
    base: { background: "#F3F2EC", subtheme1: "#244037", highlight: "#B64B2A" },
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
    label: "Ink",
    base: { background: "#EFECE4", subtheme1: "#22352D", highlight: "#D0643C" },
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
    label: "Clay",
    base: { background: "#F4F1E8", subtheme1: "#2B3E34", highlight: "#D66A41" },
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
    mode: "local",
    sessionId: null,
    authed: false,
    syncing: false,
    error: null,
    session: null,
    themePresetId: "brand",
    customTheme: { ...DEFAULT_CUSTOM_THEME },
    localEdits: {},
    localComments: [],
  };
}

export function loadStudioState(): StudioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStudioState();
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    const def = defaultStudioState();
    return {
      ...def,
      ...parsed,
      // Never persist live session/sync state
      syncing: false,
      error: null,
      session: null,
      localEdits: parsed.localEdits ?? {},
      localComments: parsed.localComments ?? [],
      customTheme: { ...DEFAULT_CUSTOM_THEME, ...(parsed.customTheme ?? {}) },
    };
  } catch {
    return defaultStudioState();
  }
}

export function saveStudioState(state: StudioState) {
  try {
    // Only persist the local/preference parts, not live session data
    const toSave: Partial<StudioState> = {
      themePresetId: state.themePresetId,
      customTheme: state.customTheme,
      localEdits: state.localEdits,
      localComments: state.localComments,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

/** Apply a preset's CSS vars to :root */
export function applyThemePreset(presetId: StudioThemePresetId) {
  const preset = STUDIO_THEME_PRESETS.find((p) => p.id === presetId) ?? STUDIO_THEME_PRESETS[0];
  applyThemeVars(preset.vars);
}

/** Apply arbitrary CSS vars to :root */
export function applyThemeVars(vars: Partial<Record<string, string>>) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v === "string") root.style.setProperty(k, v);
  }
}

/** Apply a custom 3-slot theme to :root by mapping slots to brand variables */
export function applyCustomTheme(theme: StudioCustomTheme) {
  applyThemeVars({
    "--background": theme.background,
    "--primary": theme.subtheme1,
    "--accent": theme.highlight,
    // Derive muted from background with slight tint
  });
}

/** Get the base 3-slot values for a given preset */
export function getPresetBase(presetId: StudioThemePresetId): StudioCustomTheme {
  const preset = STUDIO_THEME_PRESETS.find((p) => p.id === presetId);
  return preset?.base ?? { ...DEFAULT_CUSTOM_THEME };
}

/** Generate a compact UUID-like ID */
export function genId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Detect if a string is a UUID (session token) vs local flag */
export function isSessionToken(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
}
