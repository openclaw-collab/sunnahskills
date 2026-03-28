import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStudio } from "./useStudio";
import { canUseLocalStudio } from "./studioStore";
import { ComponentHighlighter } from "./ComponentHighlighter";
import { PasswordGate } from "./PasswordGate";
import { InspectorPanel, PageImageLibrary, PageTextLibrary, StudioTextPanel, StudioThemePanel } from "./InspectorPanel";
import { ChangesExport } from "./ChangesExport";
import { listVisibleStudioComponents } from "./studioDom";
import { TextSelectionEditor } from "./TextSelectionEditor";

type PanelTab = "inspect" | "theme" | "text" | "export";

export default function StudioShell() {
  const { state, setEnabled, pinnedComponentId, setPinnedComponentId, blocks } = useStudio();
  const adminLoginHref = `/admin?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<PanelTab>("inspect");
  const [navigateMode, setNavigateMode] = useState(false);
  const [selectedSurfaceKey, setSelectedSurfaceKey] = useState("__root");
  const visibleComponents = useMemo(
    () => (state.enabled ? listVisibleStudioComponents() : []),
    [state.enabled, pinnedComponentId, open, navigateMode, blocks],
  );

  useEffect(() => {
    setSelectedSurfaceKey("__root");
  }, [pinnedComponentId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const allowLocalHotkeys = state.mode === "local" && canUseLocalStudio();
      if (allowLocalHotkeys && (e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setEnabled(!state.enabled);
      }
      if (allowLocalHotkeys && e.key === "Escape") {
        if (navigateMode) setNavigateMode(false);
        else if (open) setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.enabled, state.mode, navigateMode, open]);

  if (state.mode === "admin" && !state.authed) {
    return (
      <div
        data-studio-ui="1"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/60 backdrop-blur-sm"
      >
        <div className="w-[min(100vw-2rem,30rem)] rounded-3xl bg-white shadow-2xl p-8">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">
            Stakeholder Studio
          </div>
          <h2 className="font-heading text-2xl text-charcoal mb-1">Admin sign-in required</h2>
          <p className="font-body text-sm text-charcoal/60 mb-6">
            This Studio link only opens for signed-in admins.
          </p>
          <div className="flex flex-col gap-3">
            {state.loading ? (
              <div className="rounded-full bg-cream px-5 py-3 text-center text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/60">
                Checking your admin session...
              </div>
            ) : (
              <a
                href={adminLoginHref}
                className="rounded-full bg-charcoal px-5 py-3 text-center text-[11px] font-mono-label uppercase tracking-[0.18em] text-cream transition-colors hover:bg-moss"
              >
                Sign in as admin
              </a>
            )}
            {state.error && !state.loading && (
              <p className="text-sm text-charcoal/55">{state.error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!state.enabled) return null;

  if (state.loading && state.mode === "session") {
    return (
      <div
        data-studio-ui="1"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
          <span className="font-mono-label text-[10px] uppercase tracking-widest text-cream/70">
            Loading session…
          </span>
        </div>
      </div>
    );
  }

  // Navigate mode: hide everything except a small badge to return
  if (navigateMode) {
    return (
      <>
        <div
          data-studio-ui="1"
          className="fixed bottom-6 right-6 z-[80]"
        >
          <button
            type="button"
            onClick={() => setNavigateMode(false)}
            className="rounded-full bg-charcoal/90 text-cream px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] shadow-lg backdrop-blur-sm border border-cream/10 hover:bg-charcoal transition-colors"
            aria-label="Return to edit mode"
          >
            ✎ Resume Editing
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PasswordGate />
      <ComponentHighlighter disabled={navigateMode} />
      <TextSelectionEditor />

      {/* Floating toggle button */}
      <div data-studio-ui="1" className="fixed bottom-6 right-6 z-[80]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "rounded-full px-5 py-2.5 text-[11px] font-mono-label uppercase tracking-[0.18em] shadow-lg transition-all",
            open ? "bg-charcoal text-cream" : "bg-white text-charcoal border border-charcoal/20 hover:bg-charcoal hover:text-cream",
          )}
        >
          {open ? "Hide Studio" : "✎ Studio"}
        </button>
      </div>

      {/* Panel */}
      {open && state.authed && (
        <div
          data-studio-ui="1"
          className="fixed bottom-20 right-6 z-[80] w-[min(400px,calc(100vw-2rem))] max-h-[calc(100vh-8rem)] flex flex-col rounded-3xl border border-charcoal/10 bg-white shadow-[0_30px_80px_rgba(26,26,26,0.18)] overflow-hidden"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-charcoal/8 bg-cream/30 shrink-0">
            <div>
              <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-moss">Stakeholder Studio</div>
              <div className="font-heading text-base text-charcoal">
                {state.mode === "session" ? (state.session?.name ?? "Shared Session") : "Local Review"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {state.syncing && (
                <span className="text-[9px] font-mono-label uppercase tracking-widest text-charcoal/40">Syncing…</span>
              )}
              <button
                type="button"
                onClick={() => setNavigateMode(true)}
                className="rounded-full border border-charcoal/15 bg-cream px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/70 hover:bg-charcoal hover:text-cream transition-colors"
                title="Hide Studio panel and navigate normally"
              >
                Navigate
              </button>
              <button
                type="button"
                onClick={() => setEnabled(false)}
                className="rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60 hover:bg-cream transition-colors"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-charcoal/8 bg-cream/20 shrink-0">
            {(["inspect", "text", "theme", "export"] as PanelTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-mono-label uppercase tracking-widest transition-colors",
                  tab === t
                    ? "text-charcoal border-b-2 border-clay bg-white"
                    : "text-charcoal/40 hover:text-charcoal/70",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content (scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Inspect tab */}
            {tab === "inspect" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-charcoal/10 bg-cream/30 p-3">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
                    Components on this page
                  </div>
                  <div className="mt-2 text-xs text-charcoal/50">
                    Pick a section first, then refine its text, images, and inner elements.
                  </div>
                  <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                    {visibleComponents.map((component) => (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => {
                          setPinnedComponentId(component.id);
                          setSelectedSurfaceKey("__root");
                        }}
                        className={cn(
                          "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                          pinnedComponentId === component.id
                            ? "border-clay bg-white"
                            : "border-charcoal/10 bg-white hover:bg-cream/50",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-heading text-charcoal">{component.label}</div>
                            <div className="mt-1 text-xs text-charcoal/45">
                              {component.surfaceCount > 0
                                ? "Section styling, inner surfaces, and media available"
                                : "Section styling and content editing available"}
                            </div>
                          </div>
                          <div className="shrink-0 text-right font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40">
                            <div>{component.textCount} text</div>
                            <div>{component.imageCount} images</div>
                            <div>{component.surfaceCount} surfaces</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <PageImageLibrary />
                <PageTextLibrary />
                <InspectorPanel
                  selectedSurfaceKey={selectedSurfaceKey}
                  onSelectSurface={setSelectedSurfaceKey}
                />
              </div>
            )}

            {tab === "text" && <StudioTextPanel />}

            {tab === "theme" && (
              <StudioThemePanel
                selectedSurfaceKey={selectedSurfaceKey}
                onSelectSurface={setSelectedSurfaceKey}
              />
            )}

            {tab === "export" && <ChangesExport />}
          </div>
        </div>
      )}
    </>
  );
}
