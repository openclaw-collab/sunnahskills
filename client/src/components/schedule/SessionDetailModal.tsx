import { useEffect } from "react";
import { X, Clock, Calendar, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import type { NormalizedSession, ScheduleTrack } from "@/lib/scheduleCalendarData";
import { formatTime12, registerHrefForSession, DAY_LABELS } from "@/lib/scheduleCalendarData";

interface SessionDetailModalProps {
  session: NormalizedSession | null;
  isOpen: boolean;
  onClose: () => void;
}

const TRACK_COLORS: Record<ScheduleTrack, { bg: string; border: string; text: string; badge: string }> = {
  kids: {
    bg: "bg-moss/15",
    border: "border-moss/25",
    text: "text-moss",
    badge: "bg-moss text-cream",
  },
  women: {
    bg: "bg-clay/15",
    border: "border-clay/25",
    text: "text-clay",
    badge: "bg-clay text-cream",
  },
  men: {
    bg: "bg-charcoal/10",
    border: "border-charcoal/20",
    text: "text-charcoal",
    badge: "bg-charcoal text-cream",
  },
  other: {
    bg: "bg-cream",
    border: "border-charcoal/15",
    text: "text-charcoal",
    badge: "bg-charcoal/70 text-cream",
  },
};

const TRACK_LABELS: Record<ScheduleTrack, string> = {
  kids: "Kids",
  women: "Women 11+",
  men: "Men 14+",
  other: "All Tracks",
};

export function SessionDetailModal({ session, isOpen, onClose }: SessionDetailModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!session) return null;

  const colors = TRACK_COLORS[session.track];
  const durationMinutes = session.endMinutes - session.startMinutes;
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const durationText =
    durationHours > 0
      ? `${durationHours} hr${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ""}`
      : `${durationMinutes} min`;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={`w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl ${colors.border}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`${colors.bg} ${colors.border} border-b px-6 py-4`}>
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${colors.badge}`}
                  >
                    <Users size={12} />
                    {TRACK_LABELS[session.track]}
                  </span>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-charcoal/60 transition-colors hover:bg-white/50 hover:text-charcoal"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold leading-tight text-charcoal">{session.label}</h2>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 text-charcoal/70">
                    <Clock size={18} className={colors.text} />
                    <span className="text-sm">
                      {formatTime12(session.startMinutes)} - {formatTime12(session.endMinutes)}
                    </span>
                    <span className="text-xs text-charcoal/40">({durationText})</span>
                  </div>

                  <div className="flex items-center gap-3 text-charcoal/70">
                    <Calendar size={18} className={colors.text} />
                    <span className="text-sm">{DAY_LABELS[session.dayIndex]}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-charcoal/60">
                  Join us for {session.label.toLowerCase()}. All skill levels welcome.
                </p>
              </div>

              <div className="px-6 pb-6">
                <Link
                  href={registerHrefForSession(session)}
                  className={`block w-full rounded-xl px-4 py-3 text-center font-medium transition-all ${
                    session.registerable
                      ? "bg-moss text-cream hover:bg-moss/90"
                      : "cursor-not-allowed bg-charcoal/10 text-charcoal/70"
                  }`}
                  onClick={onClose}
                >
                  {session.registerable ? "Register for Class" : "View Program Details"}
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
