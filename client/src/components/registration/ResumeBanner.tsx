import React from "react";
import { motion } from "framer-motion";

type Props = {
  programName: string;
  onResume: () => void;
  onStartFresh: () => void;
};

export function ResumeBanner({ programName, onResume, onStartFresh }: Props) {
  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <motion.div
        className="pointer-events-auto flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-charcoal/15 bg-charcoal shadow-[0_20px_60px_rgba(26,26,26,0.4)] px-6 py-4 max-w-lg w-full"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
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
            className="px-4 py-2 rounded-xl border border-cream/15 font-mono-label text-[10px] uppercase tracking-[0.15em] text-cream/50 hover:text-cream/80 hover:border-cream/30 transition-colors transition-transform duration-150 ease-out active:scale-[0.98] motion-safe:transform-gpu"
          >
            Start fresh
          </button>
          <button
            type="button"
            onClick={onResume}
            className="px-4 py-2 rounded-xl bg-clay font-mono-label text-[10px] uppercase tracking-[0.15em] text-cream hover:bg-clay/90 transition-colors transition-transform duration-150 ease-out shadow-sm active:scale-[0.98] motion-safe:transform-gpu"
          >
            Resume →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
