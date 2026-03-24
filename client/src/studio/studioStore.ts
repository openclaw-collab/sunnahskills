import type { StudioCustomTheme, StudioState, StudioThemePreset, StudioThemePresetId } from "./studioTypes";

const STORAGE_KEY = "sunnahskills:studio:v2";
const LOCAL_STUDIO_QUERY_VALUE = "1";

export const DEFAULT_CUSTOM_THEME: StudioCustomTheme = {
  pageBackground: "#F2F0E9",
  surfaceMain: "#FFFFFF",
  surfaceSub: "#E4DED0",
  textMain: "#1A1A1A",
  textSub: "#6A6258",
  accent: "#CC5833",
};

export const STUDIO_THEME_PRESETS: StudioThemePreset[] = [
  {
    id: "brand",
    label: "Brand",
    base: {
      pageBackground: "#F2F0E9",
      surfaceMain: "#FFFFFF",
      surfaceSub: "#E4DED0",
      textMain: "#1A1A1A",
      textSub: "#6A6258",
      accent: "#CC5833",
    },
    vars: {
      "--background": "#F2F0E9",
      "--card": "#FFFFFF",
      "--popover": "#FFFFFF",
      "--foreground": "#1A1A1A",
      "--primary": "#2E4036",
      "--secondary": "#E4DED0",
      "--accent": "#CC5833",
      "--muted": "#E4DED0",
      "--muted-foreground": "#6A6258",
      "--border": withAlpha("#2E4036", 0.12),
      "--input": "#FFFFFF",
      "--ring": "#2E4036",
    },
  },
  {
    id: "sage",
    label: "Sage",
    base: {
      pageBackground: "#F3F2EC",
      surfaceMain: "#FFFFFF",
      surfaceSub: "#E8E2D6",
      textMain: "#151515",
      textSub: "#6A665E",
      accent: "#B64B2A",
    },
    vars: {
      "--background": "#F3F2EC",
      "--card": "#FFFFFF",
      "--popover": "#FFFFFF",
      "--foreground": "#151515",
      "--primary": "#244037",
      "--secondary": "#E8E2D6",
      "--accent": "#B64B2A",
      "--muted": "#E8E2D6",
      "--muted-foreground": "#6A665E",
      "--border": withAlpha("#244037", 0.12),
      "--input": "#FFFFFF",
      "--ring": "#244037",
    },
  },
  {
    id: "ink",
    label: "Ink",
    base: {
      pageBackground: "#EFECE4",
      surfaceMain: "#FFFFFF",
      surfaceSub: "#E4DDCF",
      textMain: "#0E0E0E",
      textSub: "#625C55",
      accent: "#D0643C",
    },
    vars: {
      "--background": "#EFECE4",
      "--card": "#FFFFFF",
      "--popover": "#FFFFFF",
      "--foreground": "#0E0E0E",
      "--primary": "#22352D",
      "--secondary": "#E4DDCF",
      "--accent": "#D0643C",
      "--muted": "#E4DDCF",
      "--muted-foreground": "#625C55",
      "--border": withAlpha("#22352D", 0.12),
      "--input": "#FFFFFF",
      "--ring": "#22352D",
    },
  },
  {
    id: "clay",
    label: "Clay",
    base: {
      pageBackground: "#F4F1E8",
      surfaceMain: "#FFFFFF",
      surfaceSub: "#E8E0D1",
      textMain: "#171717",
      textSub: "#6D655C",
      accent: "#D66A41",
    },
    vars: {
      "--background": "#F4F1E8",
      "--card": "#FFFFFF",
      "--popover": "#FFFFFF",
      "--foreground": "#171717",
      "--primary": "#2B3E34",
      "--secondary": "#E8E0D1",
      "--accent": "#D66A41",
      "--muted": "#E8E0D1",
      "--muted-foreground": "#6D655C",
      "--border": withAlpha("#2B3E34", 0.12),
      "--input": "#FFFFFF",
      "--ring": "#2B3E34",
    },
  },
];

type LegacyStudioTheme = Partial<StudioCustomTheme> & {
  background?: string;
  subtheme1?: string;
  highlight?: string;
};

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const alphaHex = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${alphaHex}`;
}

export function normalizeCustomTheme(theme?: LegacyStudioTheme | null): StudioCustomTheme {
  return {
    pageBackground: theme?.pageBackground ?? theme?.background ?? DEFAULT_CUSTOM_THEME.pageBackground,
    surfaceMain: theme?.surfaceMain ?? theme?.subtheme1 ?? DEFAULT_CUSTOM_THEME.surfaceMain,
    surfaceSub: theme?.surfaceSub ?? DEFAULT_CUSTOM_THEME.surfaceSub,
    textMain: theme?.textMain ?? DEFAULT_CUSTOM_THEME.textMain,
    textSub: theme?.textSub ?? DEFAULT_CUSTOM_THEME.textSub,
    accent: theme?.accent ?? theme?.highlight ?? DEFAULT_CUSTOM_THEME.accent,
  };
}

export function defaultStudioState(): StudioState {
  return {
    enabled: false,
    mode: "local",
    sessionId: null,
    authed: false,
    syncing: false,
    loading: false,
    error: null,
    session: null,
    themePresetId: "brand",
    customTheme: { ...DEFAULT_CUSTOM_THEME },
    localEdits: {},
    localComments: [],
  };
}

export function canUseLocalStudio() {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_STUDIO_LOCAL === "1";
}

export function isLocalStudioQueryValue(value: string | null) {
  return value === LOCAL_STUDIO_QUERY_VALUE;
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
      loading: false,
      error: null,
      session: null,
      localEdits: parsed.localEdits ?? {},
      localComments: parsed.localComments ?? [],
      customTheme: normalizeCustomTheme(parsed.customTheme as LegacyStudioTheme | undefined),
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
    "--background": theme.pageBackground,
    "--card": theme.surfaceMain,
    "--popover": theme.surfaceMain,
    "--foreground": theme.textMain,
    "--primary": theme.surfaceMain,
    "--secondary": theme.surfaceSub,
    "--accent": theme.accent,
    "--muted": theme.surfaceSub,
    "--muted-foreground": theme.textSub,
    "--border": withAlpha(theme.textMain, 0.12),
    "--input": theme.surfaceMain,
    "--ring": theme.accent,
  });
}

/** Get the base 3-slot values for a given preset */
export function getPresetBase(presetId: StudioThemePresetId): StudioCustomTheme {
  const preset = STUDIO_THEME_PRESETS.find((p) => p.id === presetId);
  return normalizeCustomTheme(preset?.base);
}

export function resolveActiveTheme(themePresetId: StudioThemePresetId, customTheme: StudioCustomTheme) {
  return themePresetId === "custom" ? normalizeCustomTheme(customTheme) : getPresetBase(themePresetId);
}

/** Generate a compact UUID-like ID */
export function genId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Detect if a string is a UUID (session token) vs local flag */
export function isSessionToken(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
}
