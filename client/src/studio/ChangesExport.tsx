import { useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useStudio } from "./useStudio";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ChangesExport() {
  const { state, exportJson, reset, createSharedSession } = useStudio();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionPassword, setSessionPassword] = useState("");
  const [showShareForm, setShowShareForm] = useState(false);

  const preview = useMemo(() => {
    const edits = state.session?.edits ?? Object.entries(state.localEdits).map(([k, v]) => ({
      route: "/",
      key: k,
      newValue: v,
    }));
    const comments = state.session?.comments ?? state.localComments;
    return { edits, comments };
  }, [state.session, state.localEdits, state.localComments]);

  const hasChanges = preview.edits.length > 0 || preview.comments.length > 0;

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(exportJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setSharing(true);
    const url = await createSharedSession({ name: sessionName || undefined, password: sessionPassword || undefined });
    setSharing(false);
    if (url) {
      setShareUrl(url);
      toast({ title: "Session created", description: "Share the link with collaborators." });
    } else {
      toast({ title: "Error", description: "Failed to create session.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-cream/60 border border-charcoal/8 p-3 text-center">
          <div className="font-heading text-2xl text-charcoal">{preview.edits.length}</div>
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/50 mt-0.5">edits</div>
        </div>
        <div className="rounded-2xl bg-cream/60 border border-charcoal/8 p-3 text-center">
          <div className="font-heading text-2xl text-charcoal">{preview.comments.length}</div>
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/50 mt-0.5">comments</div>
        </div>
      </div>

      {/* Change preview */}
      {hasChanges && (
        <div className="rounded-2xl border border-charcoal/10 bg-cream/30 p-3 space-y-2 max-h-48 overflow-auto">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/50">Preview</div>
          {preview.edits.slice(-3).map((e: any, i: number) => (
            <div key={i} className="text-xs">
              <span className="text-charcoal/40">Edit: </span>
              <span className="text-charcoal/70">{e.key || e.fieldKey || "text"}</span>
              <span className="text-charcoal/40 mx-1">→</span>
              <span className="text-charcoal">{e.newValue?.slice(0, 30)}{e.newValue?.length > 30 ? "…" : ""}</span>
            </div>
          ))}
          {preview.comments.slice(-2).map((c: any, i: number) => (
            <div key={i} className="text-xs">
              <span className="text-charcoal/40">Comment: </span>
              <span className="text-charcoal/70">{c.message?.slice(0, 40)}{c.message?.length > 40 ? "…" : ""}</span>
            </div>
          ))}
        </div>
      )}

      {/* Session status */}
      {state.mode === "session" && state.sessionId && (
        <div className="rounded-2xl border border-charcoal/10 bg-cream/40 p-3">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-moss mb-1">Shared session</div>
          <div className="text-xs text-charcoal/60 break-all">
            {window.location.origin}/?studio={state.sessionId}
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/?studio=${state.sessionId}`)}
            className="mt-2 rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/70 hover:bg-cream transition-colors"
          >
            Copy link
          </button>
          {state.syncing && (
            <span className="ml-3 text-[10px] text-charcoal/40 font-mono-label uppercase tracking-widest">
              Syncing…
            </span>
          )}
        </div>
      )}

      {/* Create shared link (local mode only) */}
      {state.mode === "local" && (
        <div>
          {!showShareForm && (
            <button
              type="button"
              onClick={() => setShowShareForm(true)}
              className="w-full rounded-2xl border border-dashed border-charcoal/20 bg-cream/40 py-3 text-[11px] font-mono-label uppercase tracking-widest text-charcoal/60 hover:bg-cream/70 transition-colors"
            >
              + Create shared link
            </button>
          )}
          {showShareForm && !shareUrl && (
            <div className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4 space-y-3">
              <div className="font-mono-label text-[10px] uppercase tracking-widest text-charcoal/50">
                Create shared session
              </div>
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Session name (optional)"
                className="w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-moss/30"
                data-studio-ui="1"
              />
              <input
                type="password"
                value={sessionPassword}
                onChange={(e) => setSessionPassword(e.target.value)}
                placeholder="Password (optional)"
                className="w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-moss/30"
                data-studio-ui="1"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex-1 rounded-full bg-charcoal text-cream py-2 text-[10px] font-mono-label uppercase tracking-widest disabled:opacity-50"
                >
                  {sharing ? "Creating…" : "Create link"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareForm(false)}
                  className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {shareUrl && (
            <div className="rounded-2xl border border-moss/30 bg-moss/5 p-4 space-y-2">
              <div className="font-mono-label text-[10px] uppercase tracking-widest text-moss">Share this link</div>
              <div className="text-xs text-charcoal/70 break-all">{shareUrl}</div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(shareUrl)}
                className="rounded-full bg-moss text-cream px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest"
              >
                Copy link
              </button>
            </div>
          )}
        </div>
      )}

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadText(`sunnahskills-studio-${Date.now()}.json`, exportJson())}
          className="rounded-full bg-charcoal text-cream px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/70 hover:bg-cream transition-colors"
        >
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-charcoal/15 bg-cream px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60 hover:bg-charcoal/5 transition-colors"
        >
          Reset all
        </button>
      </div>
    </div>
  );
}
