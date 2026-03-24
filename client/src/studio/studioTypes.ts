// ---------- Theme ----------

export type StudioThemePresetId = "brand" | "sage" | "ink" | "clay" | "custom";

/** The 3-slot custom palette model */
export type StudioCustomTheme = {
  pageBackground: string;
  surfaceMain: string;
  surfaceSub: string;
  textMain: string;
  textSub: string;
  accent: string;
};

export type StudioThemePreset = {
  id: StudioThemePresetId;
  label: string;
  /** CSS variable overrides applied to :root */
  vars: Partial<Record<string, string>>;
  /** Matching 3-slot values for the custom theme editor */
  base: StudioCustomTheme;
};

// ---------- Targeting ----------

/**
 * Stable targeting: prefer componentId+fieldKey when the element carries
 * data-studio-component / data-studio-field attributes.
 * Fall back to an autoId assigned by autoTextStudio.ts for unattributed nodes.
 */
export type StudioEditTarget =
  | { componentId: string; fieldKey: string; autoId?: string }
  | { autoId: string; componentId?: string; fieldKey?: string };

export type StudioEditType = "text" | "image" | "theme" | "token";

// ---------- Entries ----------

/** One edit change. Maps 1:1 to studio_edits in D1 (or stored in session JSON). */
export type StudioEditEntry = {
  id: string;
  route: string;
  target: StudioEditTarget;
  type: StudioEditType;
  oldValue: string;
  newValue: string;
  author?: string;
  createdAt: string;
};

export type StudioCommentEntry = {
  id: string;
  route: string;
  componentId?: string;
  message: string;
  author?: string;
  createdAt: string;
};

export type StudioUploadEntry = {
  id: string;
  route: string;
  slotKey: string;
  url: string;
  filename?: string;
  createdAt: string;
};

// ---------- Session (shared, matches backend) ----------

export type StudioPosition = { dx: number; dy: number };

export type StudioSession = {
  id: string;
  name?: string;
  protected: boolean;
  themePresetId: StudioThemePresetId;
  customTheme?: StudioCustomTheme;
  edits: StudioEditEntry[];
  comments: StudioCommentEntry[];
  uploads: StudioUploadEntry[];
  /** Visual drag offsets keyed by componentId */
  positions?: Record<string, StudioPosition>;
};

// ---------- Frontend state ----------

export type StudioState = {
  enabled: boolean;
  /** "local" = ?studio=1 / localStorage only. "session" = ?studio=UUID synced via D1. */
  mode: "local" | "session";
  sessionId: string | null;
  authed: boolean;
  syncing: boolean;
  loading: boolean;
  error: string | null;
  /** Populated in session mode */
  session: StudioSession | null;
  /** Local mode fields (also used as optimistic cache in session mode) */
  themePresetId: StudioThemePresetId;
  customTheme: StudioCustomTheme;
  /** key = componentId::fieldKey or autoId → value for backward compat with StudioText */
  localEdits: Record<string, string>;
  localComments: StudioCommentEntry[];
};

export type StudioBlockMeta = {
  id: string;
  label: string;
  page?: string;
};

// ---------- Export shape (the JSON stakeholders download) ----------

export type StudioExport = {
  exportedAt: string;
  sessionId?: string;
  theme: StudioCustomTheme;
  changes: Array<{
    route: string;
    componentId?: string;
    fieldKey?: string;
    autoId?: string;
    type: StudioEditType;
    oldValue: string;
    newValue: string;
    author?: string;
    timestamp: string;
  }>;
  comments: Array<{
    route: string;
    componentId?: string;
    message: string;
    author?: string;
    timestamp: string;
  }>;
};
