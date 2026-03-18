import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStudio } from "./useStudio";
import { ComponentHighlighter } from "./ComponentHighlighter";
import { PasswordGate } from "./PasswordGate";
import { InspectorPanel } from "./InspectorPanel";
import { ThemeEditor } from "./ThemeEditor";
import { ChangesExport } from "./ChangesExport";
import { getAutoIdFromEventTarget, getTextForAutoId } from "./autoTextStudio";

type PanelTab = "inspect" | "theme" | "text" | "export";

export default function StudioShell() {
  const { state, setEnabled, setEdit, pinnedComponentId } = useStudio();

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<PanelTab>("text");
  const [navigateMode, setNavigateMode] = useState(false);
  const [selectMode, setSelectMode] = useState(true);
  const [selectedAutoId, setSelectedAutoId] = useState<string>("");
  const [selectedDraft, setSelectedDraft] = useState<string>("");

  // When a component is pinned, auto-switch to inspect tab
  const activeTab: PanelTab = pinnedComponentId ? "inspect" : tab;
  const setActiveTab = (t: PanelTab) => {
    setTab(t);
  };

  // Auto-select click handler for "edit any text"
  const handleAutoSelect = (e: MouseEvent) => {
    if (!selectMode) return;
    if ((e.target as Element | null)?.closest?.("[data-studio-ui='1']")) return;
    const autoId = getAutoIdFromEventTarget(e.target);
    if (!autoId) return;
    if (!(e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedAutoId(autoId);
    setSelectedDraft(getTextForAutoId(autoId) ?? "");
    setTab("text");
    setOpen(true);
  };

  // Attach / detach click handler based on selectMode
  useState(() => {
    if (!state.enabled) return;
    window.addEventListener("click", handleAutoSelect as EventListener, true);
    return () => window.removeEventListener("click", handleAutoSelect as EventListener, true);
  });

  if (!state.enabled) return null;

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
            className="rounded-full bg-charcoal/80 text-cream px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] shadow-lg backdrop-blur-sm border border-cream/10 hover:bg-charcoal transition-colors"
            title="Return to Studio mode"
          >
            ↩ Studio
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PasswordGate />
      <ComponentHighlighter disabled={navigateMode} />

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
                onClick={() => setActiveTab(t)}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-mono-label uppercase tracking-widest transition-colors",
                  activeTab === t
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
            {activeTab === "inspect" && (
              <div>
                {pinnedComponentId ? (
                  <InspectorPanel />
                ) : (
                  <div className="text-center py-6">
                    <div className="text-2xl mb-2">↗</div>
                    <p className="text-sm text-charcoal/50">
                      Hover over a highlighted section and click to inspect it.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Text / auto-select tab */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
                      Edit any text
                    </div>
                    <div className="mt-0.5 text-xs text-charcoal/50">
                      Click any text. Cmd/Ctrl+Click to follow links.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectMode((v) => !v)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest border transition-all",
                      selectMode
                        ? "bg-charcoal text-cream border-charcoal"
                        : "bg-white text-charcoal/60 border-charcoal/15 hover:bg-cream",
                    )}
                  >
                    {selectMode ? "Select: On" : "Select: Off"}
                  </button>
                </div>

                {selectedAutoId ? (
                  <div className="rounded-2xl border border-charcoal/10 bg-cream/40 p-3 space-y-2">
                    <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40 truncate">
                      {selectedAutoId}
                    </div>
                    <textarea
                      value={selectedDraft}
                      onChange={(e) => setSelectedDraft(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
                      data-studio-ui="1"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEdit(selectedAutoId, selectedDraft)}
                        className="rounded-full bg-charcoal text-cream px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest"
                      >
                        Save text
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedAutoId(""); setSelectedDraft(""); }}
                        className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-charcoal/15 bg-cream/30 py-6 text-center text-sm text-charcoal/40">
                    No text selected. Click any text on the page.
                  </div>
                )}
              </div>
            )}

            {/* Theme tab */}
            {activeTab === "theme" && <ThemeEditor />}

            {/* Export tab */}
            {activeTab === "export" && <ChangesExport />}
          </div>
        </div>
      )}
    </>
  );
}
