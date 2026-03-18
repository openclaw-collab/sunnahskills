import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const { state, setEdit } = useStudio();
  const value = state.edits[k] ?? defaultText;
  const Tag: any = as;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!editing) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [editing]);

  const canEdit = state.enabled;

  const onCommit = () => {
    setEdit(k, draft);
    setEditing(false);
  };

  const onCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const helper = useMemo(() => {
    if (!canEdit) return null;
    return (
      <span className="ml-2 align-middle inline-flex items-center rounded-full border border-charcoal/10 bg-cream/70 px-2 py-1 text-[10px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50">
        edit
      </span>
    );
  }, [canEdit]);

  if (!canEdit) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag className={cn("relative", className)}>
      {editing ? (
        <span className="block">
          {multiline ? (
            <textarea
              ref={(el) => (inputRef.current = el)}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(6, Math.max(3, draft.split("\n").length))}
              className="w-full rounded-2xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal shadow-sm outline-none focus:ring-2 focus:ring-moss/30"
            />
          ) : (
            <input
              ref={(el) => (inputRef.current = el)}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-2xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal shadow-sm outline-none focus:ring-2 focus:ring-moss/30"
            />
          )}
          <span className="mt-2 flex gap-2">
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
          className="text-left hover:underline decoration-charcoal/20 underline-offset-4"
          aria-label="Edit text"
        >
          {value}
          {helper}
        </button>
      )}
    </Tag>
  );
}

