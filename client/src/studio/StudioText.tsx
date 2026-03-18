import React, { useEffect, useRef, useState } from "react";
import { useStudio } from "./useStudio";
import { cn } from "@/lib/utils";

type Props = {
  k: string;
  defaultText: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3";
  className?: string;
  multiline?: boolean;
};

export function StudioText({ k, defaultText, as = "span", className, multiline }: Props) {
  const { state, edits, setEdit } = useStudio();
  const value = edits[k] ?? defaultText;
  const Tag = as as any;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (!editing) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [editing]);

  const canEdit = state.enabled;

  const onCommit = () => {
    setEdit(k, draft, { oldValue: defaultText });
    setEditing(false);
  };

  const onCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!canEdit) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      className={cn("relative", className)}
      data-studio-field={k.split(".").pop()}
    >
      {editing ? (
        <span className="block">
          {multiline ? (
            <textarea
              ref={(el) => (inputRef.current = el)}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(6, Math.max(3, draft.split("\n").length))}
              className="w-full rounded-2xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal shadow-sm outline-none focus:ring-2 focus:ring-moss/30"
              data-studio-ui="1"
            />
          ) : (
            <input
              ref={(el) => (inputRef.current = el)}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-2xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal shadow-sm outline-none focus:ring-2 focus:ring-moss/30"
              data-studio-ui="1"
            />
          )}
          <span className="mt-2 flex gap-2" data-studio-ui="1">
            <button
              type="button"
              onClick={onCommit}
              className="rounded-full bg-charcoal px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] text-cream"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/70"
            >
              Cancel
            </button>
          </span>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-left hover:underline decoration-charcoal/20 underline-offset-4 group"
          aria-label="Edit text"
        >
          {value}
          <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center rounded border border-charcoal/20 bg-cream/70 px-1.5 py-0.5 text-[9px] font-mono-label uppercase tracking-widest text-charcoal/50">
            edit
          </span>
        </button>
      )}
    </Tag>
  );
}
