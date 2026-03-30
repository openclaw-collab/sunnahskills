import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { OutlineButton } from "@/components/brand/OutlineButton";
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
  GRID_START_MIN,
  GRID_END_MIN,
  GRID_RANGE,
  minutesToTopPct,
  minutesToHeightPct,
} from "@/lib/scheduleCalendarData";

type ViewMode = "weekly" | "monthly";

const TRACK_FILTERS: { value: ScheduleTrack | "all"; label: string }[] = [
  { value: "all", label: "All tracks" },
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

// Generate time slots from 8 AM to 10 PM in 30-minute increments
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => GRID_START_MIN + i * 30);

function formatHourLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12} ${period}`;
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

// ==================== WEEKLY VIEW (Google Calendar Style) ====================

function WeeklyCalendarGrid({
  sessions,
  weekAnchor,
}: {
  sessions: NormalizedSession[];
  weekAnchor: Date;
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

  // Find concurrent sessions and calculate their widths/positions
  const getSessionLayout = (daySessions: NormalizedSession[]) => {
    if (daySessions.length === 0) return [];

    // Sort by start time, then by duration (longer first for concurrent events)
    const sorted = [...daySessions].sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
      return getSessionDuration(b) - getSessionDuration(a);
    });

    const layouts: Array<{
      session: NormalizedSession;
      column: number;
      totalColumns: number;
    }> = [];

    const columns: NormalizedSession[][] = [];

    for (const session of sorted) {
      // Find a column that doesn't conflict
      let placedColumn = -1;
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const lastSession = column[column.length - 1];
        if (lastSession.endMinutes <= session.startMinutes) {
          placedColumn = i;
          break;
        }
      }

      if (placedColumn === -1) {
        placedColumn = columns.length;
        columns.push([]);
      }

      columns[placedColumn].push(session);
      layouts.push({ session, column: placedColumn, totalColumns: columns.length });
    }

    // Update totalColumns for all layouts
    const maxColumns = columns.length;
    return layouts.map((l) => ({ ...l, totalColumns: maxColumns }));
  };

  return (
    <div className="overflow-x-auto" data-testid="schedule-weekly-view">
      <div className="min-w-[900px] lg:min-w-0">
        {/* Header Row - Day Names */}
        <div className="grid grid-cols-[60px_1fr] border-b border-charcoal/10">
          {/* Empty corner cell */}
          <div className="border-r border-charcoal/10 bg-cream/50 p-3" />

          {/* Day headers */}
          <div className="grid grid-cols-7">
            {dayDates.map((date) => {
              const dayIndex = date.getDay();
              const isToday = date.getTime() === today.getTime();
              const dayName = DAY_LABELS[dayIndex];

              return (
                <div
                  key={dayIndex}
                  className={`flex flex-col items-center justify-center py-3 px-1 border-r border-charcoal/10 last:border-r-0 ${
                    isToday ? "bg-moss/5" : "bg-cream/30"
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-moss" : "text-charcoal/60"}`}>
                    {dayName}
                  </span>
                  <span
                    className={`text-xl font-semibold mt-1 ${
                      isToday ? "text-moss" : "text-charcoal"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {isToday && (
                    <div className="mt-1 w-6 h-1 bg-moss rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-[60px_1fr] relative">
          {/* Time labels column */}
          <div className="border-r border-charcoal/10 bg-cream/50 relative">
            {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((time, index) => {
              const hourIndex = index;
              return (
                <div
                  key={time}
                  className="h-16 flex items-start justify-end pr-3 -mt-3"
                  style={{ position: "absolute", top: `${(hourIndex * 60)}px` }}
                >
                  <span className="text-xs text-charcoal/50 font-medium">
                    {formatHourLabel(time)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          <div className="relative grid grid-cols-7">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {TIME_SLOTS.map((time, i) => (
                <div
                  key={time}
                  className="absolute w-full border-t border-charcoal/5"
                  style={{ top: `${i * 30}px` }}
                />
              ))}
            </div>

            {/* Vertical grid lines */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`border-r border-charcoal/10 ${i === 6 ? "" : ""}`}
                style={{ gridColumn: i + 1 }}
              >
                {/* Hour markers for each column */}
                {TIME_SLOTS.filter((_, idx) => idx % 2 === 0).map((_, hourIdx) => (
                  <div
                    key={hourIdx}
                    className="h-[60px] border-b border-charcoal/5"
                  />
                ))}
              </div>
            ))}

            {/* Current time indicator (if today is in this week) */}
            {dayDates.some((d) => d.getTime() === today.getTime()) && (() => {
              const now = new Date();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              if (currentMinutes < GRID_START_MIN || currentMinutes > GRID_END_MIN) return null;

              const todayIndex = today.getDay();
              const topPosition = ((currentMinutes - GRID_START_MIN) / 30) * 30;

              return (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: `${(todayIndex / 7) * 100}%`,
                    width: `${100 / 7}%`,
                    top: `${topPosition}px`,
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-clay -ml-1" />
                    <div className="flex-1 h-px bg-clay" />
                  </div>
                </div>
              );
            })()}

            {/* Event blocks */}
            {dayDates.map((date, dayIdx) => {
              const dayIndex = date.getDay();
              const daySessions = sessionsByDay.get(dayIndex) ?? [];
              const layouts = getSessionLayout(daySessions);
              const isToday = date.getTime() === today.getTime();

              return (
                <div
                  key={dayIndex}
                  className={`relative min-h-[840px] ${isToday ? "bg-moss/[0.02]" : ""}`}
                  style={{ gridColumn: dayIdx + 1 }}
                >
                  {layouts.map(({ session, column, totalColumns }) => {
                    const track = getTrackForSession(session);
                    const colors = TRACK_COLORS[track];
                    const top = minutesToTopPct(session.startMinutes);
                    const height = minutesToHeightPct(session.startMinutes, session.endMinutes);
                    const width = 100 / totalColumns;
                    const left = column * width;
                    const duration = getSessionDuration(session);
                    const isShort = duration <= 60;

                    return (
                      <Link key={session.id} href={registerHrefForSession(session)}>
                        <a
                          className={`absolute block rounded-lg border ${colors.bg} ${colors.border} ${colors.hover}
                            transition-all duration-200 overflow-hidden group
                            ${isShort ? "py-1 px-2" : "p-2.5"}`}
                          style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            left: `${left + 1}%`,
                            width: `${width - 2}%`,
                            minHeight: "24px",
                          }}
                          title={session.label}
                        >
                          <div className={`font-semibold leading-tight ${isShort ? "text-[11px]" : "text-sm"} text-charcoal`}>
                            {session.shortLabel}
                          </div>
                          {!isShort && (
                            <div className="mt-1 text-xs text-charcoal/70 flex items-center gap-1">
                              <Clock size={10} />
                              <span>
                                {formatShortTime(session.startMinutes)} - {formatShortTime(session.endMinutes)}
                              </span>
                            </div>
                          )}
                          {isShort && (
                            <div className="text-[10px] text-charcoal/60 mt-0.5">
                              {formatShortTime(session.startMinutes)}
                            </div>
                          )}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.text.replace("text-", "bg-")}`} />
                        </a>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MONTHLY VIEW (Calendar Grid) ====================

function MonthCalendarGrid({
  sessions,
  monthAnchor,
}: {
  sessions: NormalizedSession[];
  monthAnchor: Date;
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
                {daySessions.slice(0, 4).map((session) => {
                  const track = getTrackForSession(session);
                  const colors = TRACK_COLORS[track];

                  return (
                    <Link key={session.id} href={registerHrefForSession(session)}>
                      <a
                        className={`block text-xs rounded-md px-2 py-1.5 border ${colors.bg} ${colors.border} ${colors.hover} transition-colors`}
                        title={session.label}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.text.replace("text-", "bg-")}`} />
                          <span className="font-medium text-charcoal truncate">{session.shortLabel}</span>
                        </div>
                        <div className="text-[10px] text-charcoal/60 mt-0.5 ml-2.5">
                          {formatShortTime(session.startMinutes)}
                        </div>
                      </a>
                    </Link>
                  );
                })}

                {daySessions.length === 0 && (
                  <div className="text-xs text-charcoal/30 italic py-2">No classes</div>
                )}

                {daySessions.length > 4 && (
                  <div className="text-[10px] text-charcoal/50 pl-2">
                    +{daySessions.length - 4} more
                  </div>
                )}
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
}: {
  sessions: NormalizedSession[];
  weekAnchor: Date;
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

      {/* Time slots list */}
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
              <Link key={session.id} href={registerHrefForSession(session)}>
                <a className="block bg-white rounded-xl border border-charcoal/10 p-4 hover:shadow-md transition-shadow">
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
                </a>
              </Link>
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
                        ? "bg-charcoal text-cream border-charcoal"
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
                <WeeklyCalendarGrid sessions={filtered} weekAnchor={weekAnchor} />
              ) : (
                <MonthCalendarGrid sessions={filtered} monthAnchor={monthAnchor} />
              )}
            </div>

            {/* Mobile View */}
            <div className="md:hidden p-4">
              <MobileDayView sessions={filtered} weekAnchor={weekAnchor} />
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
    </MotionPage>
  );
};

export default Schedule;
