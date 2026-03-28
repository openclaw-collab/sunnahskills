import { useCallback, useEffect, useState } from "react";
import { useStudio } from "./useStudio";
import { getStudioComponentElement, resolveSurfaceCandidateFromElement, type StudioSurfaceCandidate } from "./studioDom";

function getRect(candidate: StudioSurfaceCandidate | null) {
  if (!candidate) return null;
  const rect = candidate.element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function SurfacePickerOverlay({
  active,
  selectedSurfaceKey,
  onSelectSurface,
}: {
  active: boolean;
  selectedSurfaceKey: string;
  onSelectSurface: (key: string) => void;
}) {
  const { state, pinnedComponentId } = useStudio();
  const [hovered, setHovered] = useState<StudioSurfaceCandidate | null>(null);

  const resolveCandidate = useCallback(
    (target: EventTarget | null) => {
      if (!pinnedComponentId) return null;
      if (!(target instanceof Element)) return null;
      if (target.closest("[data-studio-ui='1']")) return null;
      return resolveSurfaceCandidateFromElement(pinnedComponentId, target);
    },
    [pinnedComponentId],
  );

  useEffect(() => {
    if (!state.enabled || !active || !pinnedComponentId) return;

    const onMove = (event: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) return;
      setHovered(resolveCandidate(event.target));
    };

    const onClick = (event: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim()) return;
      const candidate = resolveCandidate(event.target);
      const root = pinnedComponentId ? getStudioComponentElement(pinnedComponentId) : null;
      if (!candidate && !(event.target instanceof Element && root?.contains(event.target))) return;
      event.preventDefault();
      event.stopPropagation();
      onSelectSurface(candidate?.key ?? "__root");
      setHovered(candidate);
    };

    const onLeave = () => setHovered(null);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick, true);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick, true);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [active, onSelectSurface, pinnedComponentId, resolveCandidate, state.enabled]);

  if (!state.enabled || !active || !pinnedComponentId) return null;

  const visibleCandidate = hovered && hovered.key !== "__root" ? hovered : null;
  const rect = getRect(visibleCandidate);

  if (!visibleCandidate || !rect) return null;

  return (
    <div data-studio-ui="1" aria-hidden style={{ position: "fixed", inset: 0, zIndex: 66, pointerEvents: "none" }}>
      <div
        style={{
          position: "fixed",
          top: rect.top - 2,
          left: rect.left - 2,
          width: rect.width + 4,
          height: rect.height + 4,
          borderRadius: 16,
          outline: visibleCandidate.key === selectedSurfaceKey ? "2px solid rgba(37, 99, 235, 0.9)" : "2px solid rgba(37, 99, 235, 0.55)",
          background: visibleCandidate.key === selectedSurfaceKey ? "rgba(37, 99, 235, 0.06)" : "rgba(37, 99, 235, 0.03)",
          boxShadow: "0 18px 40px rgba(37,99,235,0.08)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: Math.max(8, rect.top - 28),
          left: rect.left,
          background: visibleCandidate.key === selectedSurfaceKey ? "rgba(37, 99, 235, 0.95)" : "rgba(17, 24, 39, 0.86)",
          color: "#fff",
          fontSize: 10,
          fontFamily: "monospace",
          padding: "4px 10px",
          borderRadius: 999,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {visibleCandidate.groupLabel} · {visibleCandidate.label}
      </div>
    </div>
  );
}
