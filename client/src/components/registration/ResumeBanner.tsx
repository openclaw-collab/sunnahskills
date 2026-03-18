import React from "react";

type Props = {
  programName: string;
  onResume: () => void;
  onStartFresh: () => void;
};

export function ResumeBanner({ programName, onResume, onStartFresh }: Props) {
  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <div
        className="pointer-events-auto flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-charcoal/15 bg-charcoal shadow-[0_20px_60px_rgba(26,26,26,0.4)] px-6 py-4 max-w-lg w-full"
        style={{ animation: "slideUp 280ms cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.2em] text-moss mb-0.5">
            Saved draft
          </div>
          <p className="font-body text-sm text-cream/80 truncate">
            Continue your {programName} registration
          </p>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <button
            type="button"
            onClick={onStartFresh}
            className="px-4 py-2 rounded-xl border border-cream/15 font-mono-label text-[10px] uppercase tracking-[0.15em] text-cream/50 hover:text-cream/80 hover:border-cream/30 transition-colors"
          >
            Start fresh
          </button>
          <button
            type="button"
            onClick={onResume}
            className="px-4 py-2 rounded-xl bg-clay font-mono-label text-[10px] uppercase tracking-[0.15em] text-cream hover:bg-clay/90 transition-colors shadow-sm"
          >
            Resume →
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
