import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { SessionDetailModal } from "@/components/schedule/SessionDetailModal";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";
import {
  DAY_LABELS,
  NORMALIZED_SESSIONS,
  type NormalizedSession,
  type ScheduleTrack,
  formatTime12,
  registerHrefForSession,
} from "@/lib/scheduleCalendarData";

type ViewMode = "weekly" | "monthly";

const TRACK_FILTERS: { value: ScheduleTrack | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "kids", label: "Kids" },
  { value: "women", label: "Women 11+" },
  { value: "men", label: "Men 14+" },
];

const TRACK_COLORS: Record<ScheduleTrack, { bg: string; border: string; text: string; hover: string }> = {
  kids: {
    bg: "bg-moss/15",
    border: "border-moss/25",
    text: "text-moss",
    hover: "hover:bg-moss/20",
  },
  women: {
    bg: "bg-clay/15",
    border: "border-clay/25",
    text: "text-clay",
    hover: "hover:bg-clay/20",
  },
  men: {
    bg: "bg-charcoal/10",
    border: "border-charcoal/20",
    text: "text-charcoal",
    hover: "hover:bg-charcoal/15",
  },
  other: {
    bg: "bg-cream",
    border: "border-charcoal/15",
    text: "text-charcoal",
    hover: "hover:bg-white",
  },
};

function sessionMatchesFilter(s: NormalizedSession, f: ScheduleTrack | "all") {
  if (f === "all") return true;
  return s.track === f;
}

function getSessionDuration(session: NormalizedSession): number {
  return session.endMinutes - session.startMinutes;
}

function getTrackForSession(session: NormalizedSession): ScheduleTrack {
  return session.track;
}

function formatShortTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "p" : "a";
  const h12 = h24 % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")}${period}`;
}

function formatWeekRange(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startMonth = start.toLocaleString("en-US", { month: "short" });
  const endMonth = end.toLocaleString("en-US", { month: "short" });

  if (sameMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

// ==================== WEEKLY VIEW (Column-Based) ====================

function WeeklyCalendarGrid({
  sessions,
  weekAnchor,
  onSessionClick,
}: {
  sessions: NormalizedSession[];
  weekAnchor: Date;
  onSessionClick: (session: NormalizedSession) => void;
}) {
  const startOfWeek = new Date(weekAnchor);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return date;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group sessions by day index
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, NormalizedSession[]>();
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      map.set(
        dayIndex,
        sessions.filter((s) => s.dayIndex === dayIndex).sort((a, b) => a.startMinutes - b.startMinutes),
      );
    }
    return map;
  }, [sessions]);

  return (
    <div className="overflow-x-auto" data-testid="schedule-weekly-view">
      <div className="min-w-[900px] lg:min-w-0">
        <div className="grid grid-cols-7 gap-3">
          {dayDates.map((date) => {
            const dayIndex = date.getDay();
            const isToday = date.getTime() === today.getTime();
            const dayName = DAY_LABELS[dayIndex];
            const daySessions = sessionsByDay.get(dayIndex) ?? [];

            return (
              <div
                key={dayIndex}
                className={`flex min-h-[400px] flex-col rounded-xl border ${
                  isToday ? "border-moss/20 bg-moss/5" : "border-charcoal/10 bg-white"
                }`}
              >
                <div
                  className={`border-b px-3 py-3 ${
                    isToday ? "border-moss/20 bg-moss/10" : "border-charcoal/10 bg-cream/30"
                  }`}
                >
                  <div className={`text-xs font-medium uppercase tracking-wide ${isToday ? "text-moss" : "text-charcoal/50"}`}>
                    {dayName}
                  </div>
                  <div className={`mt-1 text-2xl font-semibold ${isToday ? "text-moss" : "text-charcoal"}`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className="flex-1 space-y-2 p-2">
                  {daySessions.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-xs italic text-charcoal/30">No classes</div>
                  ) : (
                    daySessions.map((session) => {
                      const track = getTrackForSession(session);
                      const colors = TRACK_COLORS[track];

                      return (
                        <button
                          key={session.id}
                          onClick={() => onSessionClick(session)}
                          className={`group block w-full rounded-lg border p-3 text-left transition-all duration-200 ${colors.bg} ${colors.border} ${colors.hover}`}
                        >
                          <div className={`mb-1 text-xs font-medium ${colors.text}`}>
                            {formatShortTime(session.startMinutes)} - {formatShortTime(session.endMinutes)}
                          </div>
                          <div className="text-sm font-semibold leading-tight text-charcoal">{session.shortLabel}</div>
                          <div className={`mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide ${colors.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                            {track === "kids" ? "Kids" : track === "women" ? "Women 11+" : track === "men" ? "Men 14+" : "All"}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==================== MONTHLY VIEW (Full Grid, No Truncation) ====================

function MonthCalendarGrid({
  sessions,
  monthAnchor,
  onSessionClick,
}: {
  sessions: NormalizedSession[];
  monthAnchor: Date;
  onSessionClick: (session: NormalizedSession) => void;
}) {
  const y = monthAnchor.getFullYear();
  const mo = monthAnchor.getMonth();
  const first = new Date(y, mo, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  // Group sessions by weekday (since schedule is recurring weekly)
  const sessionsByWeekday = useMemo(() => {
    const map = new Map<number, NormalizedSession[]>();
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      map.set(
        dayIndex,
        sessions
          .filter((s) => s.dayIndex === dayIndex)
          .sort((a, b) => a.startMinutes - b.startMinutes),
      );
    }
    return map;
  }, [sessions]);

  const today = new Date();
  const isThisMonth = today.getFullYear() === y && today.getMonth() === mo;

  return (
    <div className="border border-charcoal/10 rounded-xl overflow-hidden bg-cream/30" data-testid="schedule-monthly-view">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-charcoal/10 bg-cream/50">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="py-3 px-2 text-center text-xs font-medium text-charcoal/60 uppercase tracking-wide border-r border-charcoal/10 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[100px] bg-cream/20 border-r border-b border-charcoal/5 last:border-r-0"
              />
            );
          }

          const date = new Date(y, mo, day);
          const weekday = date.getDay();
          const daySessions = sessionsByWeekday.get(weekday) ?? [];
          const isToday = isThisMonth && day === today.getDate();

          return (
            <div
              key={day}
              className={`min-h-[100px] border-r border-b border-charcoal/10 p-2 last:border-r-0 transition-colors hover:bg-cream/40 ${
                isToday ? "bg-moss/5" : "bg-white"
              }`}
            >
              <div className={`text-sm font-semibold mb-2 ${isToday ? "text-moss" : "text-charcoal/70"}`}>
                {day}
                {isToday && <span className="ml-1 text-[10px] text-moss font-normal">(Today)</span>}
              </div>

              <div className="space-y-1.5">
                {daySessions.map((session) => {
                  const track = getTrackForSession(session);
                  const colors = TRACK_COLORS[track];

                  return (
                    <button
                      key={session.id}
                      onClick={() => onSessionClick(session)}
                      className={`block w-full rounded-md border px-2 py-1.5 text-left transition-colors ${colors.bg} ${colors.border} ${colors.hover}`}
                      title={session.label}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.text.replace("text-", "bg-")}`} />
                        <span className="whitespace-nowrap text-xs text-charcoal/60">
                          {formatShortTime(session.startMinutes)}
                        </span>
                        <span className="truncate text-xs font-medium text-charcoal">{session.shortLabel}</span>
                      </div>
                    </button>
                  );
                })}

                {daySessions.length === 0 ? <div className="py-1 text-xs italic text-charcoal/30">No classes</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== MOBILE DAY VIEW ====================

function MobileDayView({
  sessions,
  weekAnchor,
  onSessionClick,
}: {
  sessions: NormalizedSession[];
  weekAnchor: Date;
  onSessionClick: (session: NormalizedSession) => void;
}) {
  const [currentDayIndex, setCurrentDayIndex] = useState(() => {
    const today = new Date();
    return today.getDay();
  });

  const startOfWeek = new Date(weekAnchor);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const currentDate = new Date(startOfWeek);
  currentDate.setDate(currentDate.getDate() + currentDayIndex);

  const daySessions = sessions
    .filter((s) => s.dayIndex === currentDayIndex)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = currentDate.getTime() === today.getTime();

  const navigateDay = (delta: number) => {
    const newIndex = (currentDayIndex + delta + 7) % 7;
    setCurrentDayIndex(newIndex);
  };

  return (
    <div className="md:hidden" data-testid="schedule-mobile-view">
      {/* Day selector */}
      <div className="flex items-center justify-between mb-4 bg-cream/50 rounded-xl p-2 border border-charcoal/10">
        <button
          onClick={() => navigateDay(-1)}
          className="p-2 rounded-lg hover:bg-white transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={20} className="text-charcoal" />
        </button>

        <div className="text-center">
          <div className={`text-lg font-semibold ${isToday ? "text-moss" : "text-charcoal"}`}>
            {DAY_LABELS[currentDayIndex]} {currentDate.getDate()}
          </div>
          {isToday && <div className="text-xs text-moss">Today</div>}
        </div>

        <button
          onClick={() => navigateDay(1)}
          className="p-2 rounded-lg hover:bg-white transition-colors"
          aria-label="Next day"
        >
          <ChevronRight size={20} className="text-charcoal" />
        </button>
      </div>

      {/* Sessions list */}
      <div className="space-y-3">
        {daySessions.length === 0 ? (
          <div className="text-center py-12 bg-cream/30 rounded-xl border border-charcoal/10">
            <div className="text-charcoal/50">No classes scheduled</div>
            <div className="text-sm text-charcoal/30 mt-1">
              {DAY_LABELS[currentDayIndex]}s are rest days
            </div>
          </div>
        ) : (
          daySessions.map((session) => {
            const track = getTrackForSession(session);
            const colors = TRACK_COLORS[track];
            const duration = getSessionDuration(session);

            return (
              <button
                key={session.id}
                onClick={() => onSessionClick(session)}
                className="block w-full rounded-xl border border-charcoal/10 bg-white p-4 text-left transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {/* Time column */}
                  <div className="flex-shrink-0 w-20">
                    <div className="text-sm font-semibold text-charcoal">
                      {formatTime12(session.startMinutes)}
                    </div>
                    <div className="text-xs text-charcoal/50">
                      {formatTime12(session.endMinutes)}
                    </div>
                    <div className="text-[10px] text-charcoal/40 mt-1">
                      {Math.round(duration / 60 * 10) / 10} hr
                    </div>
                  </div>

                  {/* Event content */}
                  <div className={`flex-1 rounded-lg border ${colors.bg} ${colors.border} p-3 relative overflow-hidden`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.text.replace("text-", "bg-")}`} />
                    <div className="font-semibold text-charcoal">{session.shortLabel}</div>
                    <div className="text-sm text-charcoal/70 mt-1">{session.label}</div>
                    <div className={`inline-flex items-center gap-1 mt-2 text-[10px] uppercase tracking-wide ${colors.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                      {track === "kids" ? "Kids" : track === "women" ? "Women 11+" : track === "men" ? "Men 14+" : "All"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

const Schedule = () => {
  const [view, setView] = useState<ViewMode>("weekly");
  const [filter, setFilter] = useState<ScheduleTrack | "all">("all");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [selectedSession, setSelectedSession] = useState<NormalizedSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSessionClick = (session: NormalizedSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedSession(null), 200);
  };

  const filtered = useMemo(
    () => NORMALIZED_SESSIONS.filter((session) => sessionMatchesFilter(session, filter)),
    [filter],
  );

  const weekTitle = useMemo(() => formatWeekRange(weekAnchor), [weekAnchor]);
  const monthTitle = monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" });

  const shiftWeek = (delta: number) => {
    const date = new Date(weekAnchor);
    date.setDate(date.getDate() + delta * 7);
    setWeekAnchor(date);
  };

  const shiftMonth = (delta: number) => {
    const date = new Date(monthAnchor);
    date.setMonth(date.getMonth() + delta);
    setMonthAnchor(date);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const tracks = new Set(filtered.map((s) => s.track));
    const weeklySlots = filtered.length;
    return {
      tracks: tracks.size,
      classes: filtered.length,
      timeWindows: weeklySlots,
    };
  }, [filtered]);

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />

      {/* Clean Header */}
      <StudioBlock id="schedule.header" label="Header" page="Schedule">
        <header className="mx-auto max-w-6xl px-6 pt-28">
          <div className="border-b border-charcoal/10 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="text-sm font-medium text-charcoal/50 uppercase tracking-wide">
                  Class Schedule
                </div>
                <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-charcoal tracking-tight">
                  Weekly Training Calendar
                </h1>
                <p className="mt-3 text-charcoal/60 max-w-xl text-base">
                  <StudioText
                    k="schedule.header.description"
                    defaultText="View all BJJ classes across our 13-week semester. Filter by track, switch between weekly and monthly views, and register for your preferred sessions."
                    as="span"
                    className="inline"
                    multiline
                  />
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-charcoal">{stats.classes}</div>
                  <div className="text-xs text-charcoal/50 uppercase tracking-wide">Weekly Classes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-charcoal">{stats.tracks}</div>
                  <div className="text-xs text-charcoal/50 uppercase tracking-wide">Training Tracks</div>
                </div>
              </div>
            </div>
          </div>
        </header>
      </StudioBlock>

      <StudioBlock id="schedule.calendar" label="Calendar" page="Schedule">
        <main className="mx-auto max-w-6xl px-6 pt-6">
          {/* Filter & View Controls */}
          <MotionDiv delay={0.02}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              {/* Track Filters */}
              <div className="flex flex-wrap gap-2">
                {TRACK_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      filter === option.value
                        ? "border-moss bg-moss text-cream"
                        : "bg-white text-charcoal/70 border-charcoal/15 hover:border-charcoal/30 hover:text-charcoal"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* View Toggle & Navigation */}
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="inline-flex rounded-lg border border-charcoal/15 bg-cream/50 p-1">
                  {(["weekly", "monthly"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        view === mode
                          ? "bg-white text-charcoal shadow-sm"
                          : "text-charcoal/60 hover:text-charcoal"
                      }`}
                    >
                      {mode === "weekly" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-1 border border-charcoal/15 rounded-lg bg-white p-1">
                  <button
                    type="button"
                    onClick={() => (view === "weekly" ? shiftWeek(-1) : shiftMonth(-1))}
                    className="p-2 rounded-md hover:bg-cream/50 transition-colors"
                    aria-label={view === "weekly" ? "Previous week" : "Previous month"}
                  >
                    <ChevronLeft size={18} className="text-charcoal" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeekAnchor(new Date());
                      setMonthAnchor(new Date());
                    }}
                    className="px-3 py-2 rounded-md hover:bg-cream/50 transition-colors text-sm font-medium text-charcoal"
                  >
                    {view === "weekly" ? "Today" : "This Month"}
                  </button>
                  <button
                    type="button"
                    onClick={() => (view === "weekly" ? shiftWeek(1) : shiftMonth(1))}
                    className="p-2 rounded-md hover:bg-cream/50 transition-colors"
                    aria-label={view === "weekly" ? "Next week" : "Next month"}
                  >
                    <ChevronRight size={18} className="text-charcoal" />
                  </button>
                </div>
              </div>
            </div>
          </MotionDiv>

          {/* Calendar Title */}
          <div className="mb-4 flex items-center gap-3">
            <CalendarDays size={20} className="text-charcoal/40" />
            <h2 className="text-xl font-semibold text-charcoal">
              {view === "weekly" ? weekTitle : monthTitle}
            </h2>
          </div>

          {/* Calendar Views */}
          <section className="bg-white rounded-xl border border-charcoal/10 shadow-sm overflow-hidden">
            {/* Desktop Views */}
            <div className="hidden md:block">
              {view === "weekly" ? (
                <WeeklyCalendarGrid sessions={filtered} weekAnchor={weekAnchor} onSessionClick={handleSessionClick} />
              ) : (
                <MonthCalendarGrid sessions={filtered} monthAnchor={monthAnchor} onSessionClick={handleSessionClick} />
              )}
            </div>

            {/* Mobile View */}
            <div className="md:hidden p-4">
              <MobileDayView sessions={filtered} weekAnchor={weekAnchor} onSessionClick={handleSessionClick} />
            </div>
          </section>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-charcoal/50">Tracks:</span>
            {[
              { key: "kids", label: "Kids" },
              { key: "women", label: "Women 11+" },
              { key: "men", label: "Men 14+" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${TRACK_COLORS[key as ScheduleTrack].text.replace("text-", "bg-")}`} />
                <span className="text-charcoal/70">{label}</span>
              </div>
            ))}
          </div>
        </main>
      </StudioBlock>

      {/* CTA Section */}
      <StudioBlock id="schedule.cta" label="Contact CTA" page="Schedule">
        <div className="mx-auto mt-12 max-w-6xl px-6">
          <MotionDiv delay={0.08}>
            <DarkCard className="rounded-2xl py-12 text-center">
              <div className="mb-4 text-sm font-medium text-moss uppercase tracking-wide">
                <StudioText k="schedule.cta.eyebrow" defaultText="Get Started" as="span" className="inline" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold text-cream">
                <StudioText k="schedule.cta.title" defaultText="Ready to begin your training?" as="span" className="inline" />
              </h2>
              <p className="mx-auto mb-8 max-w-md text-sm text-cream/60">
                <StudioText
                  k="schedule.cta.description"
                  defaultText="Start with a free trial to experience our classes firsthand, or register now to secure your spot in the upcoming semester."
                  as="span"
                  className="inline"
                  multiline
                />
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ClayButton asChild className="px-8 py-3 text-sm font-medium">
                  <Link href="/trial">Start Free Trial</Link>
                </ClayButton>
                <OutlineButton
                  asChild
                  className="border-cream/20 px-8 py-3 text-sm font-medium text-cream hover:bg-cream/10"
                >
                  <Link href="/register">Register Now</Link>
                </OutlineButton>
              </div>
            </DarkCard>
          </MotionDiv>
        </div>
      </StudioBlock>

      <SessionDetailModal session={selectedSession} isOpen={isModalOpen} onClose={handleCloseModal} />
    </MotionPage>
  );
};

export default Schedule;
