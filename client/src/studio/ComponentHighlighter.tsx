import { useCallback, useEffect, useRef, useState } from "react";
import { useStudio } from "./useStudio";
import { applyStudioComponentOffset, clearStudioComponentOffset, getStudioComponentRect } from "./studioDom";

type OutlineRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
  id: string;
};

type DragState = {
  componentId: string;
  startMouseX: number;
  startMouseY: number;
  startDx: number;
  startDy: number;
};

export function ComponentHighlighter({ disabled }: { disabled?: boolean }) {
  const { state, setPinnedComponentId, pinnedComponentId, setHoveredComponentId, setPosition, positions } =
    useStudio();

  const [outline, setOutline] = useState<OutlineRect | null>(null);
  const frameRef = useRef<number>(0);
  const dragRef = useRef<DragState | null>(null);
  const isDragging = useRef(false);

  const refreshOutline = useCallback((componentId: string | null) => {
    if (!componentId) {
      setOutline(null);
      return;
    }
    const component = document.querySelector<HTMLElement>(`[data-studio-component="${CSS.escape(componentId)}"]`);
    const rect = getStudioComponentRect(componentId);
    if (!component || !rect) {
      setOutline(null);
      return;
    }
    const label = component.dataset.studioLabel ?? componentId;
    setOutline({ ...rect, label, id: componentId });
  }, []);

  // ── Hover tracking ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!state.enabled || disabled) return;

    const onMove = (e: MouseEvent) => {
      // Ignore while dragging
      if (isDragging.current) return;
      if ((e.target as Element | null)?.closest?.("[data-studio-ui='1']")) {
        setOutline(null);
        setHoveredComponentId(null);
        return;
      }
      const comp = (e.target as Element | null)?.closest<HTMLElement>("[data-studio-component]");
      if (!comp) {
        if (!pinnedComponentId) setOutline(null);
        setHoveredComponentId(null);
        return;
      }
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const id = comp.dataset.studioComponent ?? "";
        setHoveredComponentId(id);
        refreshOutline(id);
      });
    };

    const onClick = (e: MouseEvent) => {
      if (isDragging.current) return;
      if ((e.target as Element | null)?.closest?.("[data-studio-ui='1']")) return;
      const comp = (e.target as Element | null)?.closest<HTMLElement>("[data-studio-component]");
      if (!comp) {
        setPinnedComponentId(null);
        setHoveredComponentId(null);
        setOutline(null);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const id = comp.dataset.studioComponent ?? null;
      setPinnedComponentId(id);
      refreshOutline(id);
    };

    const onLeave = () => {
      if (isDragging.current) return;
      if (!pinnedComponentId) setOutline(null);
      setHoveredComponentId(null);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick, true);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick, true);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [state.enabled, disabled, pinnedComponentId, refreshOutline, setPinnedComponentId, setHoveredComponentId]);

  useEffect(() => {
    if (!state.enabled || disabled || !pinnedComponentId) return;
    refreshOutline(pinnedComponentId);
  }, [state.enabled, disabled, pinnedComponentId, positions, refreshOutline]);

  // ── Drag handle ─────────────────────────────────────────────────────────────

  const startDrag = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const current = positions[componentId] ?? { dx: 0, dy: 0 };
      dragRef.current = {
        componentId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startDx: current.dx,
        startDy: current.dy,
      };
      isDragging.current = true;

      const onMouseMove = (me: MouseEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = drag.startDx + (me.clientX - drag.startMouseX);
        const dy = drag.startDy + (me.clientY - drag.startMouseY);

        applyStudioComponentOffset(drag.componentId, dx, dy);
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => refreshOutline(drag.componentId));
      };

      const onMouseUp = (me: MouseEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = drag.startDx + (me.clientX - drag.startMouseX);
        const dy = drag.startDy + (me.clientY - drag.startMouseY);
        setPosition(drag.componentId, dx, dy);
        isDragging.current = false;
        dragRef.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        refreshOutline(drag.componentId);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [positions, refreshOutline, setPosition],
  );

  if (!state.enabled || disabled || !outline) return null;

  const isPinned = outline.id === pinnedComponentId;
  const pos = positions[outline.id];
  const hasMoved = pos && (Math.abs(pos.dx) > 1 || Math.abs(pos.dy) > 1);

  return (
    <div
      data-studio-ui="1"
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none" }}
    >
      <div
        style={{
          position: "fixed",
          top: Math.max(0, outline.top - 2),
          left: outline.left,
          width: outline.width,
          height: 4,
          borderRadius: 999,
          background: isPinned ? "rgba(206, 88, 51, 0.96)" : "rgba(206, 88, 51, 0.55)",
          boxShadow: isPinned ? "0 0 0 1px rgba(255,255,255,0.35)" : "none",
          pointerEvents: "none",
        }}
      />

      {/* Component outline box */}
      <div
        style={{
          position: "fixed",
          top: outline.top,
          left: outline.left,
          width: outline.width,
          height: outline.height,
          outline: isPinned
            ? "1px solid rgba(206, 88, 51, 0.32)"
            : "1px dashed rgba(206, 88, 51, 0.35)",
          outlineOffset: 2,
          background: isPinned ? "rgba(206, 88, 51, 0.04)" : "rgba(206, 88, 51, 0.02)",
          transition: "outline-color 0.1s, background 0.1s",
          pointerEvents: "none",
          borderRadius: 12,
        }}
      />

      {/* Label chip */}
      <div
        style={{
          position: "fixed",
          top: Math.max(4, outline.top - 26),
          left: outline.left,
          display: "flex",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: isPinned ? "rgba(206, 88, 51, 0.95)" : "rgba(26, 26, 26, 0.75)",
            color: "#fff",
            fontSize: 10,
            fontFamily: "monospace",
            padding: "2px 10px",
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          {isPinned ? "✎ " : ""}
          {outline.label}
          {!isPinned && <span style={{ opacity: 0.6, marginLeft: 6 }}>click to inspect</span>}
        </div>

        {/* Reset position chip */}
        {hasMoved && (
          <button
            data-studio-ui="1"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setPosition(outline.id, 0, 0);
              clearStudioComponentOffset(outline.id);
            }}
            style={{
              pointerEvents: "auto",
              background: "rgba(26,26,26,0.7)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 10,
              fontFamily: "monospace",
              padding: "2px 8px",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            ↺ reset
          </button>
        )}
      </div>

      {isPinned ? (
        <button
          data-studio-ui="1"
          onMouseDown={(e) => startDrag(e, outline.id)}
          title="Drag to reposition"
          style={{
            position: "fixed",
            top: outline.top + 8,
            left: outline.left + outline.width - 38,
            width: 30,
            height: 30,
            background: "rgba(206,88,51,0.92)",
            border: "1px solid rgba(255,255,255,0.32)",
            borderRadius: 999,
            color: "#fff",
            fontSize: 14,
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            zIndex: 1,
            userSelect: "none",
            boxShadow: "0 12px 26px rgba(0,0,0,0.18)",
          }}
        >
          ⠿
        </button>
      ) : null}
    </div>
  );
}
