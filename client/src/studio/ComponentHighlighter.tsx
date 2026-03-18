import { useCallback, useEffect, useRef, useState } from "react";
import { useStudio } from "./useStudio";

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
        setOutline(null);
        setHoveredComponentId(null);
        return;
      }
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rect = comp.getBoundingClientRect();
        const id = comp.dataset.studioComponent ?? "";
        const label = comp.dataset.studioLabel ?? id;
        setHoveredComponentId(id);
        setOutline({ top: rect.top, left: rect.left, width: rect.width, height: rect.height, label, id });
      });
    };

    const onClick = (e: MouseEvent) => {
      if (isDragging.current) return;
      if ((e.target as Element | null)?.closest?.("[data-studio-ui='1']")) return;
      const comp = (e.target as Element | null)?.closest<HTMLElement>("[data-studio-component]");
      if (!comp) return;
      e.preventDefault();
      e.stopPropagation();
      setPinnedComponentId(comp.dataset.studioComponent ?? null);
    };

    const onLeave = () => {
      if (isDragging.current) return;
      setOutline(null);
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
  }, [state.enabled, disabled, setPinnedComponentId, setHoveredComponentId]);

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

      const el = document.querySelector<HTMLElement>(
        `[data-studio-component="${CSS.escape(componentId)}"]`,
      );

      const onMouseMove = (me: MouseEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = drag.startDx + (me.clientX - drag.startMouseX);
        const dy = drag.startDy + (me.clientY - drag.startMouseY);

        // Apply transform live
        if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;

        // Update outline position live
        setOutline((prev) => {
          if (!prev || prev.id !== drag.componentId) return prev;
          return {
            ...prev,
            top: prev.top + (me.clientY - (dragRef.current?.startMouseY ?? me.clientY) - (dy - drag.startDy - (me.clientY - drag.startMouseY - (me.clientY - me.clientY)))),
            left: prev.left,
          };
        });

        // Simpler: just recompute outline from element rect on rAF
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          setOutline((prev) =>
            prev
              ? { ...prev, top: rect.top, left: rect.left, width: rect.width, height: rect.height }
              : prev,
          );
        });
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
        // Refresh outline from final element rect
        if (el) {
          const rect = el.getBoundingClientRect();
          setOutline((prev) =>
            prev
              ? { ...prev, top: rect.top, left: rect.left, width: rect.width, height: rect.height }
              : prev,
          );
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [positions, setPosition],
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
      {/* Component outline box */}
      <div
        style={{
          position: "fixed",
          top: outline.top,
          left: outline.left,
          width: outline.width,
          height: outline.height,
          outline: isPinned
            ? "2px solid rgba(206, 88, 51, 0.9)"
            : "2px dashed rgba(206, 88, 51, 0.55)",
          outlineOffset: 2,
          background: isPinned ? "rgba(206, 88, 51, 0.06)" : "rgba(206, 88, 51, 0.03)",
          transition: "outline-color 0.1s, background 0.1s",
          pointerEvents: "none",
          borderRadius: 4,
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
              const el = document.querySelector<HTMLElement>(
                `[data-studio-component="${CSS.escape(outline.id)}"]`,
              );
              if (el) el.style.transform = "";
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

      {/* Drag handle — top-right of the outline, pointer-events: auto */}
      <button
        data-studio-ui="1"
        onMouseDown={(e) => startDrag(e, outline.id)}
        title="Drag to reposition"
        style={{
          position: "fixed",
          top: outline.top + 6,
          left: outline.left + outline.width - 34,
          width: 28,
          height: 28,
          background: isPinned ? "rgba(206,88,51,0.9)" : "rgba(26,26,26,0.65)",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          fontSize: 14,
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          zIndex: 1,
          userSelect: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        ⠿
      </button>
    </div>
  );
}
