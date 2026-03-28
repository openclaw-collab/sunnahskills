import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Clock3, Users2 } from "lucide-react";
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
} from "@/lib/scheduleCalendarData";

type ViewMode = "weekly" | "monthly";
type SummaryGroupKey = "women" | "girls" | "boys" | "men";

const TRACK_FILTERS: { value: ScheduleTrack | "all"; label: string }[] = [
  { value: "all", label: "All tracks" },
  { value: "kids", label: "Kids" },
  { value: "women", label: "Women 11+" },
  { value: "men", label: "Men 14+" },
];

const TRACK_STYLES: Record<ScheduleTrack, { block: string; chip: string; accent: string }> = {
  kids: {
    block: "border-moss/18 bg-moss/[0.08] text-charcoal hover:border-moss/28 hover:bg-moss/[0.12]",
    chip: "border border-moss/18 bg-moss/[0.10] text-moss",
    accent: "from-moss/16 to-moss/4",
  },
  women: {
    block: "border-clay/18 bg-clay/[0.08] text-charcoal hover:border-clay/28 hover:bg-clay/[0.12]",
    chip: "border border-clay/20 bg-clay/[0.10] text-clay",
    accent: "from-clay/18 to-clay/5",
  },
  men: {
    block: "border-charcoal/14 bg-charcoal/[0.05] text-charcoal hover:border-charcoal/20 hover:bg-charcoal/[0.08]",
    chip: "border border-charcoal/12 bg-charcoal/[0.08] text-charcoal",
    accent: "from-charcoal/12 to-charcoal/4",
  },
  other: {
    block: "border-charcoal/12 bg-white/70 text-charcoal hover:border-charcoal/18 hover:bg-white",
    chip: "border border-charcoal/12 bg-charcoal/[0.05] text-charcoal",
    accent: "from-charcoal/10 to-transparent",
  },
};

const SUMMARY_META: Record<SummaryGroupKey, { title: string; audience: string; track: ScheduleTrack }> = {
  women: { title: "Women’s BJJ", audience: "Women 11+", track: "women" },
  girls: { title: "Girls BJJ", audience: "Girls 5–10", track: "kids" },
  boys: { title: "Boys BJJ", audience: "Boys 7–13", track: "kids" },
  men: { title: "Men’s BJJ", audience: "Men 14+", track: "men" },
};

type SessionSlot = {
  id: string;
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  sessions: NormalizedSession[];
};

type SummaryCard = {
  key: SummaryGroupKey;
  title: string;
  audience: string;
  track: ScheduleTrack;
  count: number;
  lines: string[];
  href: string;
};

function sessionMatchesFilter(s: NormalizedSession, f: ScheduleTrack | "all") {
  if (f === "all") return true;
  return s.track === f;
}

function groupSessionsIntoSlots(sessions: NormalizedSession[]) {
  const bySlot = new Map<string, SessionSlot>();

  for (const session of sessions) {
    const key = `${session.dayIndex}-${session.startMinutes}-${session.endMinutes}`;
    const existing = bySlot.get(key);
    if (existing) {
      existing.sessions.push(session);
      continue;
    }

    bySlot.set(key, {
      id: key,
      dayIndex: session.dayIndex,
      startMinutes: session.startMinutes,
      endMinutes: session.endMinutes,
      sessions: [session],
    });
  }

  return Array.from(bySlot.values()).sort(
    (a, b) =>
      a.dayIndex - b.dayIndex ||
      a.startMinutes - b.startMinutes ||
      a.endMinutes - b.endMinutes ||
      a.sessions[0].shortLabel.localeCompare(b.sessions[0].shortLabel),
  );
}

function slotTrackSummary(slot: SessionSlot) {
  const tracks = new Set(slot.sessions.map((session) => session.track));
  if (tracks.size === 1) return slot.sessions[0].track;
  return "other";
}

function slotHref(slot: SessionSlot) {
  const registerableSession = slot.sessions.find((session) => session.registerable);
  return registerableSession ? registerHrefForSession(registerableSession) : registerHrefForSession(slot.sessions[0]);
}

function slotTitle(slot: SessionSlot) {
  if (slot.sessions.length === 1) return slot.sessions[0].shortLabel;
  return `${slot.sessions.length} classes running`;
}

function slotSubtitle(slot: SessionSlot) {
  if (slot.sessions.length === 1) return slot.sessions[0].label;
  return slot.sessions.map((session) => session.shortLabel).join(" · ");
}

function getSummaryGroupKey(session: NormalizedSession): SummaryGroupKey {
  if (session.id.startsWith("women-")) return "women";
  if (session.id.startsWith("girls-")) return "girls";
  if (session.id.startsWith("boys-")) return "boys";
  return "men";
}

function buildSummaryCards(sessions: NormalizedSession[]): SummaryCard[] {
  const order: SummaryGroupKey[] = ["girls", "boys", "women", "men"];

  return order
    .map((key) => {
      const groupSessions = sessions.filter((session) => getSummaryGroupKey(session) === key);
      if (groupSessions.length === 0) return null;

      const meta = SUMMARY_META[key];
      const lines = groupSessions.map(
        (session) => `${DAY_LABELS[session.dayIndex]} · ${formatTime12(session.startMinutes)}`,
      );

      return {
        key,
        title: meta.title,
        audience: meta.audience,
        track: meta.track,
        count: groupSessions.length,
        lines,
        href: registerHrefForSession(groupSessions[0]),
      };
    })
    .filter((card): card is SummaryCard => card !== null);
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

function WeeklyScheduleBoard({
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

  return (
    <div className="overflow-x-auto" data-testid="schedule-weekly-view">
      <div className="grid min-w-[980px] grid-cols-7 gap-3 xl:min-w-0 xl:grid-cols-7">
        {dayDates.map((date) => {
          const dayIndex = date.getDay();
          const slots = groupSessionsIntoSlots(
            sessions.filter((session) => session.dayIndex === dayIndex),
          );
          const isToday = date.getTime() === today.getTime();

          return (
            <section
              key={`${date.toISOString()}-${dayIndex}`}
              className={`flex min-h-[300px] flex-col rounded-[1.8rem] border p-3.5 shadow-[0_18px_40px_rgba(26,26,26,0.05)] ${
                isToday ? "border-moss/28 bg-moss/[0.08]" : "border-charcoal/10 bg-[#fffdf8]"
              }`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-charcoal/8 pb-3">
                <div>
                  <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/42">
                    {DAY_LABELS[dayIndex]}
                  </div>
                  <div className="mt-1 font-heading text-2xl text-charcoal">{date.getDate()}</div>
                </div>
                <div
                  className={`rounded-full px-2.5 py-1 font-mono-label text-[8px] uppercase tracking-[0.16em] ${
                    isToday
                      ? "border border-moss/18 bg-white/80 text-moss"
                      : "border border-charcoal/10 bg-white/80 text-charcoal/48"
                  }`}
                >
                  {slots.length > 0 ? `${slots.length} slot${slots.length === 1 ? "" : "s"}` : "Closed"}
                </div>
              </div>

              <div className="mt-3 flex flex-1 flex-col gap-3">
                {slots.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-[1.5rem] border border-dashed border-charcoal/10 bg-cream/45 px-4 text-center">
                    <div>
                      <div className="font-heading text-lg text-charcoal/64">Closed</div>
                      <div className="mt-1 text-sm text-charcoal/48">No recurring class blocks on this day.</div>
                    </div>
                  </div>
                ) : (
                  slots.map((slot) => {
                    const summaryTrack = slotTrackSummary(slot);
                    const hasParallelSessions = slot.sessions.length > 1;

                    return (
                      <Link key={slot.id} href={slotHref(slot)}>
                        <a
                          className={`block rounded-[1.45rem] border p-3.5 transition shadow-[0_12px_28px_rgba(26,26,26,0.05)] ${TRACK_STYLES[summaryTrack].block}`}
                          title={slotSubtitle(slot)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-mono-label text-[9px] uppercase tracking-[0.14em] text-charcoal/52">
                              {formatTime12(slot.startMinutes)} - {formatTime12(slot.endMinutes)}
                            </div>
                            <div className="flex items-center gap-2">
                              {hasParallelSessions ? (
                                <span className="rounded-full border border-charcoal/10 bg-white/70 px-2 py-1 font-mono-label text-[7px] uppercase tracking-[0.14em] text-charcoal/56">
                                  Parallel
                                </span>
                              ) : null}
                              <span
                                className={`rounded-full px-2 py-1 font-mono-label text-[7px] uppercase tracking-[0.14em] ${TRACK_STYLES[summaryTrack].chip}`}
                              >
                                {hasParallelSessions ? "shared slot" : slot.sessions[0].track}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 font-heading text-[1.02rem] leading-tight text-charcoal">
                            {slotTitle(slot)}
                          </div>

                          {hasParallelSessions ? (
                            <div className="mt-3 space-y-2">
                              {slot.sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="rounded-[1rem] border border-white/70 bg-white/82 px-3 py-2"
                                >
                                  <div className="text-sm font-medium text-charcoal">{session.shortLabel}</div>
                                  <div className="mt-1 flex items-center justify-between gap-2">
                                    <div className="text-xs text-charcoal/60">{session.label}</div>
                                    <div
                                      className={`shrink-0 rounded-full px-2 py-0.5 font-mono-label text-[7px] uppercase tracking-[0.14em] ${TRACK_STYLES[session.track].chip}`}
                                    >
                                      {session.track}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm leading-relaxed text-charcoal/66">{slot.sessions[0].label}</p>
                          )}
                        </a>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({
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

  const slotsByWeekday = useMemo(() => {
    const map = new Map<number, SessionSlot[]>();
    for (let dayIndex = 0; dayIndex < DAY_LABELS.length; dayIndex += 1) {
      map.set(
        dayIndex,
        groupSessionsIntoSlots(sessions.filter((session) => session.dayIndex === dayIndex)),
      );
    }
    return map;
  }, [sessions]);

  const today = new Date();
  const isThisMonth = today.getFullYear() === y && today.getMonth() === mo;

  return (
    <div className="rounded-[2rem] border border-charcoal/10 bg-[#fffdf8] p-4 shadow-[0_20px_50px_rgba(26,26,26,0.06)] md:p-5">
      <div className="mb-3 grid grid-cols-7 gap-2 font-mono-label text-[10px] uppercase tracking-[0.14em] text-charcoal/42">
        {DAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-1 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[126px] rounded-[1.2rem] bg-cream/30" />;
          }

          const date = new Date(y, mo, day);
          const weekday = date.getDay();
          const slots = slotsByWeekday.get(weekday) ?? [];
          const highlight = isThisMonth && day === today.getDate();

          return (
            <div
              key={day}
              className={`flex min-h-[126px] flex-col rounded-[1.2rem] border px-2.5 py-2 ${
                highlight ? "border-moss/24 bg-moss/[0.08]" : "border-charcoal/10 bg-white"
              }`}
            >
              <div className={`text-sm font-semibold ${highlight ? "text-charcoal" : "text-charcoal/58"}`}>
                {day}
              </div>
              <div className="mt-2 flex flex-col gap-1.5 overflow-hidden">
                {slots.slice(0, 3).map((slot) => (
                  <Link key={`${slot.id}-${day}`} href={slotHref(slot)}>
                    <a
                      className={`truncate rounded-full px-2.5 py-1 font-mono-label text-[8px] uppercase tracking-[0.12em] ${TRACK_STYLES[slotTrackSummary(slot)].chip}`}
                      title={slotSubtitle(slot)}
                    >
                      {slot.sessions.length > 1
                        ? `${formatTime12(slot.startMinutes)} · ${slot.sessions.length} classes`
                        : `${formatTime12(slot.startMinutes)} · ${slot.sessions[0].shortLabel}`}
                    </a>
                  </Link>
                ))}
                {slots.length === 0 ? (
                  <span className="pt-2 text-xs text-charcoal/38">No class</span>
                ) : null}
                {slots.length > 3 ? (
                  <span className="pt-1 font-mono-label text-[8px] uppercase tracking-[0.14em] text-charcoal/40">
                    +{slots.length - 3} more
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-charcoal/58">
        Monthly view mirrors the weekly cadence. Shared youth blocks stay grouped, so concurrent classes still read as one training window.
      </p>
    </div>
  );
}

const Schedule = () => {
  const [view, setView] = useState<ViewMode>("weekly");
  const [filter, setFilter] = useState<ScheduleTrack | "all">("all");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  const filtered = useMemo(
    () => NORMALIZED_SESSIONS.filter((session) => sessionMatchesFilter(session, filter)),
    [filter],
  );

  const visibleSummaryCards = useMemo(() => buildSummaryCards(filtered), [filtered]);
  const weeklySlotCount = useMemo(() => groupSessionsIntoSlots(filtered).length, [filtered]);
  const weekTitle = useMemo(() => formatWeekRange(weekAnchor), [weekAnchor]);

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

  const monthTitle = monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />

      <StudioBlock id="schedule.header" label="Header" page="Schedule">
        <header className="mx-auto max-w-6xl px-6 pt-28">
          <div className="overflow-hidden rounded-[2.75rem] border border-moss/18 bg-[radial-gradient(circle_at_top_left,_rgba(172,120,84,0.34),_transparent_34%),linear-gradient(145deg,_rgba(44,57,31,0.98),_rgba(59,68,39,0.95)_48%,_rgba(118,82,56,0.90)_100%)] px-6 py-12 text-center shadow-[0_34px_90px_rgba(35,38,24,0.26)] md:px-10 md:py-16">
            <div className="mx-auto max-w-3xl">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.28em] text-cream/62">
                Class schedule
              </div>
              <h1 className="mt-4 font-heading text-4xl tracking-tight text-cream md:text-6xl">
                Weekly class schedule
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream/74 md:text-base">
                <StudioText
                  k="schedule.header.description"
                  defaultText="A clearer view of the live BJJ rhythm across the current 13-week semester. Review each weekly training window, compare tracks, and move into trial or registration when you're ready."
                  as="span"
                  className="inline"
                  multiline
                />
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: "Training streams", value: `${visibleSummaryCards.length}` },
                  { label: "Classes weekly", value: `${filtered.length}` },
                  { label: "Live time windows", value: `${weeklySlotCount}` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-full border border-white/14 bg-white/10 px-4 py-2.5 backdrop-blur-sm"
                  >
                    <div className="font-heading text-xl text-cream">{stat.value}</div>
                    <div className="font-mono-label text-[8px] uppercase tracking-[0.18em] text-cream/62">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>
      </StudioBlock>

      <StudioBlock id="schedule.calendar" label="Calendar" page="Schedule">
        <main className="mx-auto max-w-6xl px-6 pt-8">
          <MotionDiv delay={0.02}>
            <section className="rounded-[2rem] border border-clay/18 bg-[#fff7e8] p-5 shadow-[0_18px_45px_rgba(26,26,26,0.05)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-clay/18 bg-white/70 p-2 text-clay">
                    <AlertCircle size={16} />
                  </div>
                    <div>
                      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
                      13-week semester cadence
                      </div>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-charcoal/72">
                      Women 11+ train Tuesday 12:30 to 2:00 PM and Thursday 8:00 to 9:30 PM. Tuesday and Friday youth classes run at the same time, so they stay grouped into one shared training window instead of splitting into disconnected cards.
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-clay/18 bg-white/75 px-4 py-2 font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/62">
                  Spring semester live
                </div>
              </div>
            </section>
          </MotionDiv>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {TRACK_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full border px-4 py-2 font-mono-label text-[10px] uppercase tracking-[0.16em] transition ${
                  filter === option.value
                    ? "border-moss bg-moss/15 text-charcoal"
                    : "border-charcoal/12 bg-white/75 text-charcoal/58 hover:border-charcoal/20 hover:text-charcoal"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleSummaryCards.map((card) => (
              <Link key={card.key} href={card.href}>
                <a className="group block rounded-[1.8rem] border border-charcoal/10 bg-white p-5 shadow-[0_18px_42px_rgba(26,26,26,0.06)] transition hover:-translate-y-[1px] hover:shadow-[0_22px_52px_rgba(26,26,26,0.09)]">
                  <div
                    className={`rounded-[1.3rem] bg-gradient-to-br px-4 py-4 ${TRACK_STYLES[card.track].accent}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-heading text-xl text-charcoal">{card.title}</div>
                        <div className="mt-1 text-sm text-charcoal/62">{card.audience}</div>
                      </div>
                      <div className={`rounded-full px-2.5 py-1 font-mono-label text-[8px] uppercase tracking-[0.16em] ${TRACK_STYLES[card.track].chip}`}>
                        {card.count} / week
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {card.lines.map((line) => (
                      <div key={line} className="flex items-center gap-2 text-sm text-charcoal/68">
                        <Clock3 size={14} className="text-charcoal/38" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-charcoal/8 pt-4">
                    <div className="flex items-center gap-2 text-xs text-charcoal/52">
                      <Users2 size={13} />
                      <span>13-week semester track</span>
                    </div>
                    <span className="font-mono-label text-[8px] uppercase tracking-[0.16em] text-clay">
                      Registration open
                    </span>
                  </div>
                </a>
              </Link>
            ))}
          </div>

          <section className="mt-8 rounded-[2.4rem] border border-charcoal/10 bg-white p-5 shadow-[0_24px_70px_rgba(26,26,26,0.08)] md:p-6">
            <div className="flex flex-col gap-5 border-b border-charcoal/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/44">
                  <CalendarDays size={14} />
                  Interactive calendar
                </div>
                <h2 className="mt-2 font-heading text-3xl text-charcoal">{view === "weekly" ? weekTitle : monthTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/62">
                  {view === "weekly"
                    ? "Each day reads as one coherent column. If multiple classes happen at the same time, they stay grouped inside one shared training window."
                    : "Switch to month view to see the same weekly cadence carried across the full 13-week semester."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="inline-flex rounded-full border border-charcoal/10 bg-cream/45 p-1">
                  {(["weekly", "monthly"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      className={`rounded-full px-4 py-2 font-mono-label text-[10px] uppercase tracking-[0.18em] transition-colors ${
                        view === mode ? "bg-moss text-cream shadow-sm" : "text-charcoal/58 hover:text-charcoal"
                      }`}
                    >
                      {mode === "weekly" ? "Weekly" : "Monthly"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (view === "weekly" ? shiftWeek(-1) : shiftMonth(-1))}
                    className="rounded-full border border-charcoal/12 bg-white p-2 text-charcoal transition hover:bg-cream/55"
                    aria-label={view === "weekly" ? "Previous week" : "Previous month"}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeekAnchor(new Date());
                      setMonthAnchor(new Date());
                    }}
                    className="rounded-full border border-charcoal/12 bg-white px-3.5 py-2 font-mono-label text-[10px] uppercase tracking-[0.16em] text-charcoal transition hover:bg-cream/55"
                  >
                    {view === "weekly" ? "Today" : "This month"}
                  </button>
                  <button
                    type="button"
                    onClick={() => (view === "weekly" ? shiftWeek(1) : shiftMonth(1))}
                    className="rounded-full border border-charcoal/12 bg-white p-2 text-charcoal transition hover:bg-cream/55"
                    aria-label={view === "weekly" ? "Next week" : "Next month"}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {view === "weekly" ? (
                <WeeklyScheduleBoard sessions={filtered} weekAnchor={weekAnchor} />
              ) : (
                <MonthGrid sessions={filtered} monthAnchor={monthAnchor} />
              )}
            </div>
          </section>

          <StudioBlock id="schedule.alert" label="Alert" page="Schedule">
            <MotionDiv delay={0.08}>
              <div className="mt-6 rounded-[1.6rem] border border-charcoal/10 bg-white/75 px-4 py-3 shadow-[0_16px_35px_rgba(26,26,26,0.04)]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 shrink-0 text-clay" size={16} />
                  <p className="text-sm leading-relaxed text-charcoal/68">
                    <StudioText
                      k="schedule.alert.weather"
                      defaultText="This page reflects the recurring semester schedule. If a holiday, closure, or special event changes a class, enrolled families are notified directly."
                      as="span"
                      className="inline"
                      multiline
                    />
                  </p>
                </div>
              </div>
            </MotionDiv>
          </StudioBlock>
        </main>
      </StudioBlock>

      <StudioBlock id="schedule.cta" label="Contact CTA" page="Schedule">
        <div className="mx-auto mt-12 max-w-6xl px-6">
          <MotionDiv delay={0.08}>
            <DarkCard className="rounded-[2.2rem] py-12 text-center">
              <div className="mb-4 font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss">
                <StudioText k="schedule.cta.eyebrow" defaultText="Questions" as="span" className="inline" />
              </div>
              <h2 className="mb-3 font-heading text-2xl text-cream">
                <StudioText k="schedule.cta.title" defaultText="Ready to choose a first class?" as="span" className="inline" />
              </h2>
              <p className="mx-auto mb-8 max-w-md font-body text-sm text-cream/60">
                <StudioText
                  k="schedule.cta.description"
                  defaultText="Start with a free trial if you want to visit first, or open your account now and go straight into registration."
                  as="span"
                  className="inline"
                  multiline
                />
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ClayButton asChild className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/trial">Start free trial</Link>
                </ClayButton>
                <OutlineButton
                  asChild
                  className="border-cream/20 px-8 py-3.5 text-[11px] uppercase tracking-[0.18em] text-cream hover:bg-cream/10"
                >
                  <Link href="/register">Open account</Link>
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
