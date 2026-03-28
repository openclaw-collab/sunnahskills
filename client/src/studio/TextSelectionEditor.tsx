import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "./useStudio";
import { resolveSelectionTextField, type StudioSelectionTextCandidate } from "./studioDom";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function TextSelectionEditor() {
  const { state, edits, setEdit, clearEdit, setPinnedComponentId } = useStudio();
  const [target, setTarget] = useState<StudioSelectionTextCandidate | null>(null);
  const [draft, setDraft] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const closeEditor = useCallback(() => {
    setTarget(null);
  }, []);

  const syncFromSelection = useCallback(() => {
    if (!state.enabled) return;
    const active = document.activeElement;
    if (active && editorRef.current?.contains(active)) return;

    const nextTarget = resolveSelectionTextField(edits);
    if (!nextTarget) {
      setTarget((current) => {
        if (!current) return current;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) return current;
        return null;
      });
      return;
    }

    setPinnedComponentId(nextTarget.componentId ?? null);
    setTarget(nextTarget);
    setDraft(nextTarget.currentValue);
  }, [edits, setPinnedComponentId, state.enabled]);

  useEffect(() => {
    if (!state.enabled) return;

    const scheduleSync = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(syncFromSelection);
    };

    const clearOnScroll = () => setTarget(null);
    const clearOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditor();
    };

    document.addEventListener("selectionchange", scheduleSync);
    window.addEventListener("mouseup", scheduleSync, true);
    window.addEventListener("keyup", scheduleSync, true);
    window.addEventListener("scroll", clearOnScroll, true);
    window.addEventListener("keydown", clearOnEscape);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("selectionchange", scheduleSync);
      window.removeEventListener("mouseup", scheduleSync, true);
      window.removeEventListener("keyup", scheduleSync, true);
      window.removeEventListener("scroll", clearOnScroll, true);
      window.removeEventListener("keydown", clearOnEscape);
    };
  }, [closeEditor, state.enabled, syncFromSelection]);

  useEffect(() => {
    if (!target) return;
    setDraft(target.currentValue);
  }, [target]);

  useEffect(() => {
    if (!target) return;

    const onPointerDown = (event: MouseEvent) => {
      const element = event.target as Element | null;
      if (!element) return;
      if (element.closest("[data-studio-ui='1']")) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;
      closeEditor();
    };

    window.addEventListener("mousedown", onPointerDown, true);
    return () => window.removeEventListener("mousedown", onPointerDown, true);
  }, [closeEditor, target]);

  const edited = useMemo(() => (target ? target.key in edits : false), [edits, target]);

  if (!state.enabled || !target) return null;

  const panelWidth = 320;
  const left = clamp(target.rect.left + target.rect.width / 2 - panelWidth / 2, 16, window.innerWidth - panelWidth - 16);
  const showAbove = target.rect.top > 220;
  const top = showAbove
    ? Math.max(16, target.rect.top - 188)
    : Math.min(window.innerHeight - 180, target.rect.top + target.rect.height + 12);

  return (
    <div
      ref={editorRef}
      data-studio-ui="1"
      className="fixed z-[85] w-[20rem] rounded-[1.5rem] border border-charcoal/12 bg-white p-4 shadow-[0_28px_70px_rgba(26,26,26,0.24)]"
      style={{ top, left }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-clay">Selected text</div>
          <div className="mt-1 text-sm text-charcoal/55">Highlight text on the page, then edit it here.</div>
        </div>
        <button
          type="button"
          onClick={closeEditor}
          className="rounded-full border border-charcoal/10 bg-white px-2.5 py-1 text-[10px] font-mono-label uppercase tracking-[0.16em] text-charcoal/50 hover:bg-cream"
        >
          Close
        </button>
      </div>

      <div className="mt-3 rounded-[1rem] border border-charcoal/10 bg-cream/30 px-3 py-2.5">
        <div className="font-mono-label text-[8px] uppercase tracking-[0.16em] text-charcoal/40">Matched target</div>
        <div className="mt-1 text-sm text-charcoal">{target.label}</div>
        <div className="mt-2 text-xs leading-relaxed text-charcoal/55">“{target.selectedText.trim()}”</div>
      </div>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={4}
        autoFocus
        className="mt-3 w-full rounded-[1rem] border border-charcoal/12 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/25"
        data-studio-ui="1"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setEdit(target.key, draft, { oldValue: target.defaultValue });
            closeEditor();
            window.getSelection()?.removeAllRanges();
          }}
          className="rounded-full bg-charcoal px-3.5 py-2 text-[10px] font-mono-label uppercase tracking-[0.16em] text-cream"
        >
          Save text
        </button>
        {edited ? (
          <button
            type="button"
            onClick={() => {
              clearEdit(target.key);
              closeEditor();
              window.getSelection()?.removeAllRanges();
            }}
            className="rounded-full border border-charcoal/12 bg-white px-3.5 py-2 text-[10px] font-mono-label uppercase tracking-[0.16em] text-charcoal/55"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
}
