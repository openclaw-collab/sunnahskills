import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { StudioBlockMeta, StudioState, StudioThemePresetId } from "./studioTypes";
import { applyThemePreset, loadStudioState, saveStudioState } from "./studioStore";
import { applyAutoEdits, tagStudioTextNodes } from "./autoTextStudio";

type StudioContextValue = {
  state: StudioState;
  setEnabled: (enabled: boolean) => void;
  setThemePreset: (presetId: StudioThemePresetId) => void;
  setEdit: (key: string, value: string) => void;
  clearEdit: (key: string) => void;
  addComment: (blockId: string, message: string, author?: string) => void;
  listComments: (blockId: string) => StudioState["comments"][string];
  registerBlock: (meta: StudioBlockMeta) => void;
  blocks: StudioBlockMeta[];
  exportJson: () => string;
  importJson: (json: string) => { ok: true } | { ok: false; error: string };
  reset: () => void;
};

export const StudioContext = createContext<StudioContextValue | null>(null);

function hasStudioQueryParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has("studio") || params.has("feedback");
  } catch {
    return false;
  }
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>(() => {
    if (typeof window === "undefined") return loadStudioState();
    const loaded = loadStudioState();
    return { ...loaded, enabled: loaded.enabled || hasStudioQueryParam() };
  });

  const [blocks, setBlocks] = useState<StudioBlockMeta[]>([]);

  useEffect(() => {
    if (!state.enabled) return;
    applyThemePreset(state.themePresetId);
  }, [state.enabled, state.themePresetId]);

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
    const obs = new MutationObserver(() => schedule());
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });

    const onPop = () => schedule();
    window.addEventListener("popstate", onPop);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("popstate", onPop);
    };
  }, [state]);

  useEffect(() => {
    saveStudioState(state);
  }, [state]);

  const setEnabled = useCallback((enabled: boolean) => {
    setState((s) => ({ ...s, enabled }));
  }, []);

  const setThemePreset = useCallback((themePresetId: StudioThemePresetId) => {
    setState((s) => ({ ...s, themePresetId }));
  }, []);

  const setEdit = useCallback((key: string, value: string) => {
    setState((s) => ({ ...s, edits: { ...s.edits, [key]: value } }));
  }, []);

  useEffect(() => {
    // Convenience hook for the Studio panel to save auto-selected text edits
    // without threading the setter through event handlers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__studioSetEdit = (key: string, value: string) => setEdit(key, value);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__studioSetEdit;
    };
  }, [setEdit]);

  const clearEdit = useCallback((key: string) => {
    setState((s) => {
      const next = { ...s.edits };
      delete next[key];
      return { ...s, edits: next };
    });
  }, []);

  const addComment = useCallback((blockId: string, message: string, author?: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setState((s) => {
      const existing = s.comments[blockId] ?? [];
      const entry = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        author: author?.trim() || undefined,
        message: trimmed,
        createdAt: new Date().toISOString(),
      };
      return {
        ...s,
        comments: { ...s.comments, [blockId]: [...existing, entry] },
      };
    });
  }, []);

  const listComments = useCallback(
    (blockId: string) => {
      return state.comments[blockId] ?? [];
    },
    [state.comments],
  );

  const registerBlock = useCallback((meta: StudioBlockMeta) => {
    setBlocks((prev) => {
      if (prev.some((b) => b.id === meta.id)) return prev;
      return [...prev, meta].sort((a, b) => a.label.localeCompare(b.label));
    });
  }, []);

  const exportJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      themePresetId: state.themePresetId,
      edits: state.edits,
      comments: state.comments,
    };
    return JSON.stringify(payload, null, 2);
  }, [state.comments, state.edits, state.themePresetId]);

  const importJson = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<StudioState> & {
        themePresetId?: StudioThemePresetId;
        edits?: Record<string, string>;
        comments?: StudioState["comments"];
      };
      if (!parsed || typeof parsed !== "object") return { ok: false as const, error: "Invalid JSON payload." };

      setState((s) => ({
        ...s,
        enabled: true,
        themePresetId: parsed.themePresetId ?? s.themePresetId,
        edits: parsed.edits ?? s.edits,
        comments: parsed.comments ?? s.comments,
      }));
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Failed to parse JSON." };
    }
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ enabled: s.enabled, themePresetId: "brand", edits: {}, comments: {} }));
  }, []);

  const value = useMemo<StudioContextValue>(
    () => ({
      state,
      setEnabled,
      setThemePreset,
      setEdit,
      clearEdit,
      addComment,
      listComments,
      registerBlock,
      blocks,
      exportJson,
      importJson,
      reset,
    }),
    [
      state,
      setEnabled,
      setThemePreset,
      setEdit,
      clearEdit,
      addComment,
      listComments,
      registerBlock,
      blocks,
      exportJson,
      importJson,
      reset,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

