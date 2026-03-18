import { useEffect, useRef, useState } from "react";
import { useStudio } from "./useStudio";

type OutlineRect = { top: number; left: number; width: number; height: number; label: string; id: string };

export function ComponentHighlighter() {
  const { state, setPinnedComponentId, pinnedComponentId, setHoveredComponentId } = useStudio();
  const [outline, setOutline] = useState<OutlineRect | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!state.enabled) return;

    const onMove = (e: MouseEvent) => {
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
      // Throttle via rAF
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
      if ((e.target as Element | null)?.closest?.("[data-studio-ui='1']")) return;
      const comp = (e.target as Element | null)?.closest<HTMLElement>("[data-studio-component]");
      if (!comp) return;
      e.preventDefault();
      e.stopPropagation();
      const id = comp.dataset.studioComponent ?? null;
      setPinnedComponentId(id);
    };

    const onLeave = () => {
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
  }, [state.enabled, setPinnedComponentId, setHoveredComponentId]);

  if (!state.enabled || !outline) return null;

  const isPinned = outline.id === pinnedComponentId;

  return (
    <div
      data-studio-ui="1"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none" }}
    >
      {/* Component outline */}
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
          top: Math.max(4, outline.top - 24),
          left: outline.left,
          background: isPinned ? "rgba(206, 88, 51, 0.95)" : "rgba(26, 26, 26, 0.75)",
          color: "#fff",
          fontSize: 10,
          fontFamily: "monospace",
          padding: "2px 10px",
          borderRadius: 4,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}
      >
        {isPinned ? "✎ " : ""}
        {outline.label}
        {!isPinned && <span style={{ opacity: 0.6, marginLeft: 6 }}>click to inspect</span>}
      </div>
    </div>
  );
}
