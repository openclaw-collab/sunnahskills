import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { useStudio } from "./useStudio";
import { STUDIO_THEME_PRESETS } from "./studioStore";
import { getAutoIdFromEventTarget, getTextForAutoId } from "./autoTextStudio";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudioPanel() {
  const { state, setEnabled, setThemePreset, blocks, addComment, listComments, exportJson, importJson, reset } =
    useStudio();

  const [open, setOpen] = useState(true);
  const [selectMode, setSelectMode] = useState(true);
  const [selectedAutoId, setSelectedAutoId] = useState<string>("");
  const [selectedDraft, setSelectedDraft] = useState<string>("");
  const [activeBlockId, setActiveBlockId] = useState<string>("");
  const [commentDraft, setCommentDraft] = useState("");
  const [authorDraft, setAuthorDraft] = useState("");
  const [importDraft, setImportDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const activeComments = useMemo(() => {
    if (!activeBlockId) return [];
    return listComments(activeBlockId);
  }, [activeBlockId, listComments]);

  if (!state.enabled) return null;

  useEffect(() => {
    if (!state.enabled) return;
    if (!selectMode) return;
    const onClick = (e: MouseEvent) => {
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
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [state.enabled, selectMode]);

  return (
    <div data-studio-ui="1" className="fixed bottom-6 right-6 z-[80] w-[min(420px,calc(100vw-2rem))]">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-charcoal text-cream px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] shadow-lg"
        >
          {open ? "Hide Studio" : "Show Studio"}
        </button>
      </div>

      {open && (
        <PremiumCard className="bg-white border border-charcoal/10 shadow-[0_30px_80px_rgba(26,26,26,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Stakeholder Studio</div>
              <div className="mt-2 font-heading text-xl text-charcoal">Edit text, leave comments, try themes.</div>
              <div className="mt-2 font-body text-sm text-charcoal/60">
                Everything saves locally. Export JSON to share changes with you.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(false)}
              className="rounded-full border border-charcoal/15 bg-white px-3 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/70"
            >
              Exit
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
                    Edit any text
                  </div>
                  <div className="mt-1 text-sm text-charcoal/60">
                    Click text on the page to select it. Use Cmd/Ctrl+Click to follow links.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectMode((v) => !v)}
                  className={cn(
                    "rounded-full px-3 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] border",
                    selectMode
                      ? "bg-charcoal text-cream border-charcoal"
                      : "bg-white text-charcoal/70 border-charcoal/15 hover:bg-cream",
                  )}
                >
                  {selectMode ? "Select: On" : "Select: Off"}
                </button>
              </div>

              {selectedAutoId ? (
                <div className="mt-3 space-y-2">
                  <div className="text-[10px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50 truncate">
                    {selectedAutoId}
                  </div>
                  <textarea
                    value={selectedDraft}
                    onChange={(e) => setSelectedDraft(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-charcoal/15 bg-cream/40 px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Save into the same edits bag (autoId key)
                        // (provider auto-applies to tagged nodes)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (window as any).__studioSetEdit?.(selectedAutoId, selectedDraft);
                      }}
                      className="rounded-full bg-charcoal text-cream px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em]"
                    >
                      Save text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAutoId("");
                        setSelectedDraft("");
                      }}
                      className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/70"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-charcoal/60">No selection yet.</div>
              )}
            </div>

            <div className="rounded-2xl border border-charcoal/10 bg-cream/60 p-4">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">Theme</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STUDIO_THEME_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setThemePreset(p.id)}
                    className={cn(
                      "rounded-full px-3 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] border",
                      state.themePresetId === p.id
                        ? "bg-charcoal text-cream border-charcoal"
                        : "bg-white text-charcoal/70 border-charcoal/15 hover:bg-cream",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">Comments</div>
              <div className="mt-3">
                <select
                  className="w-full rounded-2xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
                  value={activeBlockId}
                  onChange={(e) => setActiveBlockId(e.target.value)}
                >
                  <option value="">Select a section…</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.page ? `${b.page} · ` : ""}
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {activeBlockId && (
                <div className="mt-3">
                  <div className="max-h-36 overflow-auto rounded-2xl border border-charcoal/10 bg-cream/40 p-3">
                    {activeComments.length === 0 ? (
                      <div className="text-sm text-charcoal/60">No comments yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {activeComments.map((c) => (
                          <div key={c.id} className="rounded-xl bg-white border border-charcoal/10 p-3">
                            <div className="text-[10px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50">
                              {c.author ? `${c.author} · ` : ""}
                              {new Date(c.createdAt).toLocaleString()}
                            </div>
                            <div className="mt-1 text-sm text-charcoal/75">{c.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <input
                      value={authorDraft}
                      onChange={(e) => setAuthorDraft(e.target.value)}
                      placeholder="Your name (optional)"
                      className="w-full rounded-2xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
                    />
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder="Leave a comment on this section…"
                      rows={3}
                      className="w-full rounded-2xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          addComment(activeBlockId, commentDraft, authorDraft);
                          setCommentDraft("");
                        }}
                        className="rounded-full bg-charcoal px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] text-cream"
                      >
                        Add comment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
                Export / Import
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadText(`sunnahskills-studio-${Date.now()}.json`, exportJson())}
                  className="rounded-full bg-charcoal text-cream px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em]"
                >
                  Download JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(exportJson());
                  }}
                  className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/70"
                >
                  Copy JSON
                </button>
                <button
                  type="button"
                  onClick={() => reset()}
                  className="rounded-full border border-charcoal/15 bg-cream px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/70"
                >
                  Reset
                </button>
              </div>

              <div className="mt-3">
                <textarea
                  value={importDraft}
                  onChange={(e) => setImportDraft(e.target.value)}
                  placeholder="Paste JSON to load edits/comments…"
                  rows={4}
                  className="w-full rounded-2xl border border-charcoal/15 bg-cream/40 px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
                />
                {importError && <div className="mt-2 text-sm text-clay">{importError}</div>}
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const result = importJson(importDraft);
                      setImportError(result.ok ? null : result.error);
                      if (result.ok) setImportDraft("");
                    }}
                    className="rounded-full bg-moss text-cream px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em]"
                  >
                    Load JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </PremiumCard>
      )}
    </div>
  );
}

