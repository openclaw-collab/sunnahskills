import { useMemo, useState } from "react";
import { useStudio } from "./useStudio";
import { cn } from "@/lib/utils";

type Tab = "edit" | "comments" | "history";

export function InspectorPanel() {
  const { state, edits, setEdit, clearEdit, addComment, setPinnedComponentId, pinnedComponentId, blocks } =
    useStudio();
  const [tab, setTab] = useState<Tab>("edit");
  const [commentDraft, setCommentDraft] = useState("");
  const [authorDraft, setAuthorDraft] = useState("");

  const pinnedBlock = useMemo(
    () => blocks.find((b) => b.id === pinnedComponentId),
    [blocks, pinnedComponentId],
  );

  const componentComments = useMemo(() => {
    const all = state.session?.comments ?? state.localComments;
    return all.filter((c) => c.componentId === pinnedComponentId);
  }, [state.session?.comments, state.localComments, pinnedComponentId]);

  const componentEdits = useMemo(() => {
    if (state.session?.edits) {
      return state.session.edits.filter((e) => {
        const cId = "componentId" in e.target ? e.target.componentId : null;
        return cId === pinnedComponentId;
      });
    }
    // Local mode: find matching localEdits by key prefix
    return Object.entries(edits)
      .filter(([k]) => k.startsWith(pinnedComponentId ?? "__none__"))
      .map(([k, v]) => ({ key: k, value: v }));
  }, [state.session?.edits, edits, pinnedComponentId]);

  if (!pinnedComponentId) return null;

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-charcoal/8 bg-cream/40">
        <div>
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-clay">Inspecting</div>
          <div className="font-heading text-sm text-charcoal mt-0.5">
            {pinnedBlock?.label ?? pinnedComponentId}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPinnedComponentId(null)}
          className="rounded-full border border-charcoal/10 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60 hover:bg-cream transition-colors"
        >
          ✕ Unpin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-charcoal/8">
        {(["edit", "comments", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-[10px] font-mono-label uppercase tracking-widest transition-colors",
              tab === t
                ? "text-charcoal border-b-2 border-clay"
                : "text-charcoal/40 hover:text-charcoal/70",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "edit" && (
          <EditTab
            pinnedComponentId={pinnedComponentId}
            edits={edits}
            setEdit={setEdit}
            clearEdit={clearEdit}
          />
        )}
        {tab === "comments" && (
          <CommentsTab
            componentId={pinnedComponentId}
            comments={componentComments}
            commentDraft={commentDraft}
            setCommentDraft={setCommentDraft}
            authorDraft={authorDraft}
            setAuthorDraft={setAuthorDraft}
            addComment={addComment}
          />
        )}
        {tab === "history" && (
          <HistoryTab componentEdits={componentEdits} />
        )}
      </div>
    </div>
  );
}

// ── Edit tab ─────────────────────────────────────────────────────────────────

function EditTab({
  pinnedComponentId,
  edits,
  setEdit,
  clearEdit,
}: {
  pinnedComponentId: string;
  edits: Record<string, string>;
  setEdit: (key: string, value: string, opts?: { oldValue?: string }) => void;
  clearEdit: (key: string) => void;
}) {
  const relevantEdits = Object.entries(edits).filter(([k]) => k.startsWith(pinnedComponentId));
  const [draftKey, setDraftKey] = useState("");
  const [draftValue, setDraftValue] = useState("");

  if (relevantEdits.length === 0 && !draftKey) {
    return (
      <div className="text-sm text-charcoal/50 text-center py-3">
        <p>No text edits for this component yet.</p>
        <p className="mt-1 text-[11px]">Click text on the page to edit it, or use the auto-select mode.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relevantEdits.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-charcoal/10 bg-cream/30 p-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40 truncate">
              {k.split(".").pop() ?? k}
            </div>
            <button
              type="button"
              onClick={() => clearEdit(k)}
              className="text-[10px] text-charcoal/40 hover:text-clay transition-colors"
            >
              ✕ Reset
            </button>
          </div>
          <EditableValue
            value={v}
            onSave={(nv) => setEdit(k, nv, { oldValue: v })}
          />
        </div>
      ))}
    </div>
  );
}

function EditableValue({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <div
        className="text-sm text-charcoal cursor-pointer hover:text-clay transition-colors"
        onClick={() => { setDraft(value); setEditing(true); }}
      >
        {value}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
        autoFocus
        data-studio-ui="1"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { onSave(draft); setEditing(false); }}
          className="rounded-full bg-charcoal text-cream px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-[10px] font-mono-label uppercase tracking-widest text-charcoal/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Comments tab ──────────────────────────────────────────────────────────────

function CommentsTab({
  componentId,
  comments,
  commentDraft,
  setCommentDraft,
  authorDraft,
  setAuthorDraft,
  addComment,
}: {
  componentId: string;
  comments: any[];
  commentDraft: string;
  setCommentDraft: (v: string) => void;
  authorDraft: string;
  setAuthorDraft: (v: string) => void;
  addComment: (params: { componentId?: string; message: string; author?: string }) => void;
}) {
  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-auto">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-charcoal/10 bg-cream/40 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40">
                  {c.author ? `${c.author} · ` : ""}
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-charcoal/75">{c.message}</p>
            </div>
          ))}
        </div>
      )}

      <input
        value={authorDraft}
        onChange={(e) => setAuthorDraft(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
        data-studio-ui="1"
      />
      <textarea
        value={commentDraft}
        onChange={(e) => setCommentDraft(e.target.value)}
        placeholder="Leave a comment on this component…"
        rows={2}
        className="w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-moss/30"
        data-studio-ui="1"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            addComment({ componentId, message: commentDraft, author: authorDraft });
            setCommentDraft("");
          }}
          disabled={!commentDraft.trim()}
          className="rounded-full bg-charcoal text-cream px-4 py-2 text-[10px] font-mono-label uppercase tracking-widest disabled:opacity-40"
        >
          Add comment
        </button>
      </div>
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab({ componentEdits }: { componentEdits: any[] }) {
  if (componentEdits.length === 0) {
    return <div className="text-sm text-charcoal/50 text-center py-3">No changes recorded yet.</div>;
  }

  return (
    <div className="space-y-2 max-h-48 overflow-auto">
      {[...componentEdits].reverse().map((e: any, i) => (
        <div key={e.id ?? e.key ?? i} className="rounded-xl border border-charcoal/10 bg-cream/30 p-3">
          <div className="font-mono-label text-[9px] uppercase tracking-widest text-charcoal/40 mb-1">
            {e.key ?? (e.target && ("fieldKey" in e.target ? e.target.fieldKey : e.target.autoId)) ?? "text"}
            {e.author && ` · ${e.author}`}
          </div>
          {e.oldValue && (
            <div className="text-[11px] text-charcoal/40 line-through mb-0.5">{e.oldValue}</div>
          )}
          <div className="text-sm text-charcoal">{e.newValue ?? e.value}</div>
        </div>
      ))}
    </div>
  );
}
