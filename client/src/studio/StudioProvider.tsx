import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  StudioBlockMeta,
  StudioCommentEntry,
  StudioCustomTheme,
  StudioEditEntry,
  StudioExport,
  StudioPosition,
  StudioSession,
  StudioState,
  StudioThemePresetId,
} from "./studioTypes";
import {
  applyCustomTheme,
  applyThemePreset,
  DEFAULT_CUSTOM_THEME,
  genId,
  getPresetBase,
  isSessionToken,
  loadStudioState,
  saveStudioState,
  STUDIO_THEME_PRESETS,
} from "./studioStore";
import { applyAutoEdits, applyImageSlots, tagStudioTextNodes } from "./autoTextStudio";

// ── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(path, { credentials: "include", ...init });
}

async function fetchSession(id: string): Promise<StudioSession | { protected: true; id: string } | null> {
  try {
    const res = await apiFetch(`/api/studio/sessions/${id}`);
    if (res.status === 401) return { protected: true, id };
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function patchSession(id: string, data: Partial<StudioSession>) {
  return apiFetch(`/api/studio/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function createSession(opts: { name?: string; password?: string }): Promise<{ id: string; shareUrl: string } | null> {
  try {
    const res = await apiFetch("/api/studio/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

export type StudioContextValue = {
  state: StudioState;
  /** Flattened edits map (key → newValue) for StudioText backward compat */
  edits: Record<string, string>;
  setEnabled: (enabled: boolean) => void;
  setThemePreset: (presetId: StudioThemePresetId) => void;
  setCustomTheme: (patch: Partial<StudioCustomTheme>) => void;
  setEdit: (key: string, newValue: string, opts?: { oldValue?: string; type?: "text" | "image" }) => void;
  clearEdit: (key: string) => void;
  addComment: (params: { componentId?: string; message: string; author?: string }) => void;
  deleteComment: (commentId: string) => void;
  registerBlock: (meta: StudioBlockMeta) => void;
  blocks: StudioBlockMeta[];
  pinnedComponentId: string | null;
  setPinnedComponentId: (id: string | null) => void;
  hoveredComponentId: string | null;
  setHoveredComponentId: (id: string | null) => void;
  exportJson: () => string;
  authenticate: (password: string) => Promise<boolean>;
  createSharedSession: (opts: { name?: string; password?: string }) => Promise<string | null>;
  /** Upload an image file for a given slot key. Returns the resulting URL or null on error. */
  uploadImage: (file: File, slotKey: string, route?: string) => Promise<string | null>;
  /** Current drag-reposition offsets keyed by componentId */
  positions: Record<string, StudioPosition>;
  setPosition: (componentId: string, dx: number, dy: number) => void;
  reset: () => void;
};

export const StudioContext = createContext<StudioContextValue | null>(null);

// ── URL helpers ───────────────────────────────────────────────────────────────

function getStudioParam(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("studio");
  } catch {
    return null;
  }
}

function currentRoute(): string {
  try {
    return window.location.pathname;
  } catch {
    return "/";
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>(() => {
    const local = loadStudioState();
    const token = getStudioParam();
    if (!token) return local;
    const isSession = isSessionToken(token);
    return {
      ...local,
      enabled: true,
      mode: isSession ? "session" : "local",
      sessionId: isSession ? token : null,
      authed: !isSession, // local mode is always authed
    };
  });

  const [blocks, setBlocks] = useState<StudioBlockMeta[]>([]);
  const [pinnedComponentId, setPinnedComponentId] = useState<string | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStateRef = useRef(state);
  localStateRef.current = state;

  // ── Session boot ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.mode !== "session" || !state.sessionId) return;

    setState((s) => ({ ...s, loading: true, error: null }));
    fetchSession(state.sessionId).then((res) => {
      if (!res) {
        setState((s) => ({ ...s, loading: false, error: "Session not found." }));
        return;
      }
      if ("protected" in res && res.protected) {
        setState((s) => ({ ...s, loading: false, authed: false }));
        return;
      }
      const sess = res as StudioSession;
      setState((s) => ({
        ...s,
        loading: false,
        session: sess,
        authed: true,
        themePresetId: sess.themePresetId ?? "brand",
        customTheme: sess.customTheme ?? { ...DEFAULT_CUSTOM_THEME },
        localEdits: flattenEdits(sess.edits),
      }));
    });
  }, [state.mode, state.sessionId]);

  // ── Polling (10s) ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.mode !== "session" || !state.sessionId || !state.authed) return;

    pollIntervalRef.current = setInterval(async () => {
      const id = localStateRef.current.sessionId;
      if (!id) return;
      const res = await fetchSession(id);
      if (!res || "protected" in res) return;
      const session = res as StudioSession;
      setState((s) => ({
        ...s,
        session,
        // Merge server edits into localEdits, keeping optimistic local additions
        localEdits: mergeEdits(s.localEdits, flattenEdits(session.edits)),
      }));
    }, 10_000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [state.mode, state.sessionId, state.authed]);

  // ── Theme application ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!state.enabled) return;
    if (state.themePresetId === "custom") {
      applyCustomTheme(state.customTheme);
    } else {
      applyThemePreset(state.themePresetId);
    }
  }, [state.enabled, state.themePresetId, state.customTheme]);

  // ── Auto-tag + apply text edits ─────────────────────────────────────────────

  useEffect(() => {
    if (!state.enabled) return;
    let raf = 0;
    const run = () => {
      tagStudioTextNodes({ excludeSelector: "[data-studio-ui='1']" });
      applyAutoEdits(state, { excludeSelector: "[data-studio-ui='1']" });
    };
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    };
    schedule();
    const obs = new MutationObserver(schedule);
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });
    window.addEventListener("popstate", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("popstate", schedule);
    };
  }, [state]);

  // Apply image slot overrides whenever uploads change
  useEffect(() => {
    if (!state.enabled) return;
    applyImageSlots(state);
  }, [state.enabled, state.session?.uploads]);

  // Apply drag-reposition transforms whenever positions change
  useEffect(() => {
    if (!state.enabled) return;
    const positions = state.session?.positions ?? {};
    for (const [id, pos] of Object.entries(positions)) {
      const el = document.querySelector<HTMLElement>(`[data-studio-component="${CSS.escape(id)}"]`);
      if (el) el.style.transform = `translate(${pos.dx}px, ${pos.dy}px)`;
    }
  }, [state.enabled, state.session?.positions]);

  // ── Persist local state ─────────────────────────────────────────────────────

  useEffect(() => {
    saveStudioState(state);
  }, [state]);

  // ── Debounced backend sync ──────────────────────────────────────────────────

  const scheduleSync = useCallback(() => {
    const s = localStateRef.current;
    if (s.mode !== "session" || !s.sessionId || !s.authed) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const curr = localStateRef.current;
      if (!curr.sessionId || !curr.session) return;
      setState((st) => ({ ...st, syncing: true }));
      try {
        await patchSession(curr.sessionId, {
          themePresetId: curr.themePresetId,
          customTheme: curr.customTheme,
          edits: curr.session.edits,
          comments: curr.session.comments,
          uploads: curr.session.uploads,
          positions: curr.session.positions,
        } as any);
      } catch {
        /* ignore transient errors */
      } finally {
        setState((st) => ({ ...st, syncing: false }));
      }
    }, 1500);
  }, []);

  // ── Global edit setter (for StudioText + autoText) ──────────────────────────

  const setEdit = useCallback(
    (key: string, newValue: string, opts?: { oldValue?: string; type?: "text" | "image" }) => {
      setState((s) => {
        const route = currentRoute();
        const editEntry: StudioEditEntry = {
          id: genId(),
          route,
          target: keyToTarget(key),
          type: opts?.type ?? "text",
          oldValue: opts?.oldValue ?? s.localEdits[key] ?? "",
          newValue,
          createdAt: new Date().toISOString(),
        };

        const newLocalEdits = { ...s.localEdits, [key]: newValue };

        if (s.mode !== "session" || !s.session) {
          return { ...s, localEdits: newLocalEdits };
        }

        // Replace any existing edit for the same key in session.edits
        const prevEdits = s.session.edits.filter((e) => editEntryKey(e) !== key);
        const session: StudioSession = {
          ...s.session,
          edits: [...prevEdits, editEntry],
        };
        return { ...s, localEdits: newLocalEdits, session };
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  // Expose globally for autoText panel callback
  useEffect(() => {
    (window as any).__studioSetEdit = (key: string, value: string) => setEdit(key, value);
    return () => void delete (window as any).__studioSetEdit;
  }, [setEdit]);

  const clearEdit = useCallback(
    (key: string) => {
      setState((s) => {
        const newLocalEdits = { ...s.localEdits };
        delete newLocalEdits[key];
        if (s.mode !== "session" || !s.session) return { ...s, localEdits: newLocalEdits };
        const session: StudioSession = {
          ...s.session,
          edits: s.session.edits.filter((e) => editEntryKey(e) !== key),
        };
        return { ...s, localEdits: newLocalEdits, session };
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  const setEnabled = useCallback((enabled: boolean) => {
    setState((s) => ({ ...s, enabled }));
  }, []);

  const setThemePreset = useCallback(
    (presetId: StudioThemePresetId) => {
      setState((s) => {
        const base = getPresetBase(presetId);
        return { ...s, themePresetId: presetId, customTheme: presetId !== "custom" ? base : s.customTheme };
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  const setCustomTheme = useCallback(
    (patch: Partial<StudioCustomTheme>) => {
      setState((s) => ({
        ...s,
        themePresetId: "custom",
        customTheme: { ...s.customTheme, ...patch },
      }));
      scheduleSync();
    },
    [scheduleSync],
  );

  const addComment = useCallback(
    ({ componentId, message, author }: { componentId?: string; message: string; author?: string }) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      const entry: StudioCommentEntry = {
        id: genId(),
        route: currentRoute(),
        componentId,
        message: trimmed,
        author: author?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setState((s) => {
        const newLocalComments = [...s.localComments, entry];
        if (s.mode !== "session" || !s.session) return { ...s, localComments: newLocalComments };
        const session: StudioSession = {
          ...s.session,
          comments: [...s.session.comments, entry],
        };
        return { ...s, localComments: newLocalComments, session };
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      setState((s) => {
        const newLocalComments = s.localComments.filter((c) => c.id !== commentId);
        if (s.mode !== "session" || !s.session) return { ...s, localComments: newLocalComments };
        const session: StudioSession = {
          ...s.session,
          comments: s.session.comments.filter((c) => c.id !== commentId),
        };
        return { ...s, localComments: newLocalComments, session };
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  const registerBlock = useCallback((meta: StudioBlockMeta) => {
    setBlocks((prev) => {
      if (prev.some((b) => b.id === meta.id)) return prev;
      return [...prev, meta].sort((a, b) => a.label.localeCompare(b.label));
    });
  }, []);

  const exportJson = useCallback((): string => {
    const s = localStateRef.current;
    const theme =
      s.themePresetId === "custom"
        ? s.customTheme
        : getPresetBase(s.themePresetId);

    const allEdits: StudioEditEntry[] = s.session?.edits ?? Object.entries(s.localEdits).map(([k, v]) => ({
      id: genId(),
      route: currentRoute(),
      target: keyToTarget(k),
      type: "text" as const,
      oldValue: "",
      newValue: v,
      author: undefined,
      createdAt: new Date().toISOString(),
    }));

    const allComments = s.session?.comments ?? s.localComments;

    const payload: StudioExport = {
      exportedAt: new Date().toISOString(),
      sessionId: s.sessionId ?? undefined,
      theme,
      changes: allEdits.map((e) => ({
        route: e.route,
        componentId: "componentId" in e.target ? e.target.componentId : undefined,
        fieldKey: "fieldKey" in e.target ? e.target.fieldKey : undefined,
        autoId: "autoId" in e.target ? e.target.autoId : undefined,
        type: e.type,
        oldValue: e.oldValue,
        newValue: e.newValue,
        author: e.author,
        timestamp: e.createdAt,
      })),
      comments: allComments.map((c) => ({
        route: c.route,
        componentId: c.componentId,
        message: c.message,
        author: c.author,
        timestamp: c.createdAt,
      })),
    };
    return JSON.stringify(payload, null, 2);
  }, []);

  const authenticate = useCallback(async (password: string): Promise<boolean> => {
    const s = localStateRef.current;
    if (!s.sessionId) return false;
    const res = await apiFetch(`/api/studio/sessions/${s.sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return false;
    // Now fetch the full session
    const sessionRes = await fetchSession(s.sessionId);
    if (!sessionRes || "protected" in sessionRes) return false;
    const session = sessionRes as StudioSession;
    setState((st) => ({
      ...st,
      authed: true,
      session,
      localEdits: flattenEdits(session.edits),
      themePresetId: session.themePresetId ?? "brand",
      customTheme: session.customTheme ?? { ...DEFAULT_CUSTOM_THEME },
    }));
    return true;
  }, []);

  const createSharedSession = useCallback(async (opts: { name?: string; password?: string }) => {
    const result = await createSession(opts);
    return result?.shareUrl ?? null;
  }, []);

  const uploadImage = useCallback(
    async (file: File, slotKey: string, route?: string): Promise<string | null> => {
      const s = localStateRef.current;
      if (!s.sessionId) {
        // Local mode: read as data URL and apply optimistically
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const url = e.target?.result as string;
            // Store as a fake upload entry in local state
            setState((st) => ({
              ...st,
              session: st.session
                ? {
                    ...st.session,
                    uploads: [
                      ...(st.session.uploads ?? []).filter((u) => u.slotKey !== slotKey),
                      {
                        id: genId(),
                        route: route ?? currentRoute(),
                        slotKey,
                        url,
                        filename: file.name,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }
                : st.session,
            }));
            resolve(url);
          };
          reader.readAsDataURL(file);
        });
      }

      // Session mode: POST to the uploads API
      setState((st) => ({ ...st, syncing: true }));
      try {
        const params = new URLSearchParams({
          session: s.sessionId!,
          slot: slotKey,
          route: route ?? currentRoute(),
        });
        const form = new FormData();
        form.append("file", file);
        const res = await apiFetch(`/api/studio/uploads?${params}`, { method: "POST", body: form });
        if (!res.ok) return null;
        const data = await res.json() as { ok: boolean; upload: { url: string } };
        const url = data.upload.url;
        // Optimistically update local session.uploads
        setState((st) => ({
          ...st,
          syncing: false,
          session: st.session
            ? {
                ...st.session,
                uploads: [
                  ...(st.session.uploads ?? []).filter((u) => u.slotKey !== slotKey),
                  {
                    id: genId(),
                    route: route ?? currentRoute(),
                    slotKey,
                    url,
                    filename: file.name,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : st.session,
        }));
        scheduleSync();
        return url;
      } catch {
        setState((st) => ({ ...st, syncing: false }));
        return null;
      }
    },
    [scheduleSync],
  );

  const setPosition = useCallback(
    (componentId: string, dx: number, dy: number) => {
      setState((s) => {
        const prev = s.session?.positions ?? {};
        const next = { ...prev, [componentId]: { dx, dy } };
        if (s.mode !== "session" || !s.session) {
          // Store in local positions (no D1) by reusing session placeholder
          return { ...s, session: s.session ? { ...s.session, positions: next } : s.session };
        }
        return { ...s, session: { ...s.session, positions: next } };
      });
      scheduleSync();
    },
    [scheduleSync],
  );

  const reset = useCallback(() => {
    setState((s) => ({
      ...s,
      themePresetId: "brand",
      customTheme: { ...DEFAULT_CUSTOM_THEME },
      localEdits: {},
      localComments: [],
      session: s.session
        ? { ...s.session, edits: [], comments: [], uploads: [], themePresetId: "brand", customTheme: undefined }
        : null,
    }));
    scheduleSync();
  }, [scheduleSync]);

  // ── Derived flat edits for StudioText ────────────────────────────────────────

  const edits = useMemo(() => state.localEdits, [state.localEdits]);

  const value = useMemo<StudioContextValue>(
    () => ({
      state,
      edits,
      setEnabled,
      setThemePreset,
      setCustomTheme,
      setEdit,
      clearEdit,
      addComment,
      deleteComment,
      registerBlock,
      blocks,
      pinnedComponentId,
      setPinnedComponentId,
      hoveredComponentId,
      setHoveredComponentId,
      exportJson,
      authenticate,
      createSharedSession,
      uploadImage,
      positions: state.session?.positions ?? {},
      setPosition,
      reset,
    }),
    [
      state,
      edits,
      setEnabled,
      setThemePreset,
      setCustomTheme,
      setEdit,
      clearEdit,
      addComment,
      deleteComment,
      registerBlock,
      blocks,
      pinnedComponentId,
      setPinnedComponentId,
      hoveredComponentId,
      setHoveredComponentId,
      exportJson,
      authenticate,
      createSharedSession,
      uploadImage,
      setPosition,
      reset,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenEdits(edits: StudioEditEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of edits) {
    out[editEntryKey(e)] = e.newValue;
  }
  return out;
}

function mergeEdits(local: Record<string, string>, server: Record<string, string>): Record<string, string> {
  return { ...server, ...local };
}

function keyToTarget(key: string): StudioEditEntry["target"] {
  // Keys from StudioText look like "about.title", "home.hero" → split at last dot
  const dotIdx = key.lastIndexOf(".");
  if (dotIdx > 0) {
    return { componentId: key.slice(0, dotIdx), fieldKey: key.slice(dotIdx + 1) };
  }
  // autoId keys look like "/route::t0"
  return { autoId: key };
}

function editEntryKey(e: StudioEditEntry): string {
  if ("componentId" in e.target && e.target.componentId && e.target.fieldKey) {
    return `${e.target.componentId}.${e.target.fieldKey}`;
  }
  return (e.target as { autoId: string }).autoId ?? "";
}
