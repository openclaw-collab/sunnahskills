import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";
import {
  DAY_LABELS,
  GRID_END_MIN,
  GRID_START_MIN,
  NORMALIZED_SESSIONS,
  type NormalizedSession,
  type ScheduleTrack,
  formatTime12,
  minutesToHeightPct,
  minutesToTopPct,
  registerHrefForSession,
} from "@/lib/scheduleCalendarData";

type ViewMode = "weekly" | "monthly";

const TRACK_FILTERS: { value: ScheduleTrack | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "kids", label: "Kids" },
  { value: "women", label: "Women 11+" },
  { value: "men", label: "Men 14+" },
];

const TRACK_STYLES: Record<ScheduleTrack, { block: string; chip: string }> = {
  kids: {
    block: "border-moss/20 bg-moss/12 text-charcoal hover:bg-moss/18",
    chip: "bg-moss/10 text-moss border border-moss/20",
  },
  women: {
    block: "border-clay/20 bg-clay/10 text-charcoal hover:bg-clay/16",
    chip: "bg-clay/10 text-clay border border-clay/20",
  },
  men: {
    block: "border-charcoal/15 bg-charcoal/8 text-charcoal hover:bg-charcoal/12",
    chip: "bg-charcoal/8 text-charcoal border border-charcoal/12",
  },
  other: {
    block: "border-charcoal/12 bg-charcoal/6 text-charcoal hover:bg-charcoal/10",
    chip: "bg-charcoal/6 text-charcoal border border-charcoal/10",
  },
};

function sessionMatchesFilter(s: NormalizedSession, f: ScheduleTrack | "all") {
  if (f === "all") return true;
  return s.track === f;
}

type SessionSlot = {
  id: string;
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  sessions: NormalizedSession[];
};

type PositionedSessionSlot = SessionSlot & {
  lane: number;
  laneCount: number;
};

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
      a.startMinutes - b.startMinutes ||
      a.endMinutes - b.endMinutes ||
      a.sessions[0].shortLabel.localeCompare(b.sessions[0].shortLabel),
  );
}

function layoutSessionSlots(slots: SessionSlot[]): PositionedSessionSlot[] {
  const laneEndTimes: number[] = [];
  const positioned: Array<SessionSlot & { lane: number }> = [];

  for (const slot of slots) {
    let lane = laneEndTimes.findIndex((end) => end <= slot.startMinutes);
    if (lane === -1) {
      lane = laneEndTimes.length;
      laneEndTimes.push(slot.endMinutes);
    } else {
      laneEndTimes[lane] = slot.endMinutes;
    }
    positioned.push({ ...slot, lane });
  }

  const laneCount = Math.max(1, laneEndTimes.length);
  return positioned.map((slot) => ({ ...slot, laneCount }));
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

function WeekGrid({
  sessions,
  weekAnchor,
}: {
  sessions: NormalizedSession[];
  weekAnchor: Date;
}) {
  const startOfWeek = new Date(weekAnchor);
  const dow = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dow);
  startOfWeek.setHours(0, 0, 0, 0);

  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeTicks = useMemo(() => {
    const out: number[] = [];
    for (let m = GRID_START_MIN; m <= GRID_END_MIN; m += 60) out.push(m);
    return out;
  }, []);

  return (
    <div className="overflow-x-auto rounded-3xl border border-charcoal/10 bg-white">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-charcoal/10 bg-cream/50">
          <div className="p-2" />
          {dayDates.map((d, i) => {
            const isToday = d.getTime() === today.getTime();
            return (
              <div
                key={i}
                className={`border-l border-charcoal/10 px-2 py-3 text-center ${isToday ? "bg-moss/10" : ""}`}
              >
                <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/45">
                  {DAY_LABELS[i]}
                </div>
                <div className={`mt-1 font-heading text-lg ${isToday ? "text-moss" : "text-charcoal"}`}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative grid grid-cols-[52px_repeat(7,1fr)]" style={{ minHeight: "520px" }}>
          <div className="relative border-r border-charcoal/10 bg-cream/30">
            {timeTicks.map((m) => (
              <div
                key={m}
                className="absolute right-1 text-right font-mono-label text-[9px] text-charcoal/40"
                style={{ top: `${minutesToTopPct(m)}%`, transform: "translateY(-50%)" }}
              >
                {formatTime12(m).replace(" ", "\u00A0")}
              </div>
            ))}
          </div>

          {dayDates.map((d, col) => {
            const dayIndex = d.getDay();
            const daySlots = layoutSessionSlots(
              groupSessionsIntoSlots(sessions.filter((session) => session.dayIndex === dayIndex)),
            );
            return (
              <div key={col} className="relative border-l border-charcoal/10">
                {timeTicks.map((m) => (
                  <div
                    key={m}
                    className="pointer-events-none absolute left-0 right-0 border-t border-charcoal/[0.06]"
                    style={{ top: `${minutesToTopPct(m)}%` }}
                  />
                ))}
                {daySlots.map((slot) => {
                  const top = minutesToTopPct(slot.startMinutes);
                  const h = minutesToHeightPct(slot.startMinutes, slot.endMinutes);
                  const laneWidth = 100 / slot.laneCount;
                  const summaryTrack = slotTrackSummary(slot);
                  const hasParallelSessions = slot.sessions.length > 1;
                  return (
                    <Link key={slot.id} href={slotHref(slot)}>
                      <a
                        className={`absolute z-[1] overflow-hidden rounded-[1.35rem] border px-3 py-2.5 text-left shadow-[0_10px_24px_rgba(26,26,26,0.08)] transition hover:shadow-[0_16px_34px_rgba(26,26,26,0.12)] ${TRACK_STYLES[summaryTrack].block}`}
                        style={{
                          top: `${top}%`,
                          height: `${Math.max(h, hasParallelSessions ? 9 : 7)}%`,
                          minHeight: hasParallelSessions ? "86px" : "56px",
                          left: `calc(${(slot.lane / slot.laneCount) * 100}% + 4px)`,
                          width: `calc(${laneWidth}% - 8px)`,
                        }}
                        title={slot.sessions.map((session) => session.label).join(" / ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-mono-label text-[8px] uppercase tracking-[0.12em] text-charcoal/55">
                            {formatTime12(slot.startMinutes)} – {formatTime12(slot.endMinutes)}
                          </div>
                          {hasParallelSessions ? (
                            <span className="rounded-full border border-charcoal/10 bg-white/75 px-2 py-1 font-mono-label text-[7px] uppercase tracking-[0.12em] text-charcoal/55">
                              Parallel
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 line-clamp-2 font-body text-[11px] font-medium leading-snug text-charcoal">
                          {slotTitle(slot)}
                        </div>
                        {hasParallelSessions ? (
                          <div className="mt-2 space-y-1.5">
                            {slot.sessions.map((session) => (
                              <div
                                key={session.id}
                                className="flex items-center justify-between gap-2 rounded-xl border border-charcoal/8 bg-white/75 px-2.5 py-1.5"
                              >
                                <div className="min-w-0 text-[10px] font-medium leading-none text-charcoal">
                                  {session.shortLabel}
                                </div>
                                <div className={`shrink-0 rounded-full px-2 py-0.5 text-[7px] font-mono-label uppercase tracking-[0.12em] ${TRACK_STYLES[session.track].chip}`}>
                                  {session.track}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[7px] font-mono-label uppercase tracking-[0.12em] ${TRACK_STYLES[summaryTrack].chip}`}>
                            {slot.sessions[0].track}
                          </div>
                        )}
                        <div className="mt-2 font-mono-label text-[8px] uppercase tracking-[0.1em] text-charcoal/60">
                          {slot.sessions.some((session) => session.registerable) ? "Register →" : "Details →"}
                        </div>
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
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

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
    <div className="rounded-[2rem] border border-charcoal/10 bg-white p-4 md:p-6 shadow-[0_20px_55px_rgba(26,26,26,0.06)]">
      <div className="mb-3 grid grid-cols-7 gap-1 font-mono-label text-[10px] uppercase tracking-[0.12em] text-charcoal/40">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`e-${idx}`} className="min-h-[88px] rounded-xl bg-cream/30" />;
          }
          const date = new Date(y, mo, day);
          const wd = date.getDay();
          const list = slotsByWeekday.get(wd) ?? [];
          const highlight = isThisMonth && day === today.getDate();

          return (
            <div
              key={day}
              className={`flex min-h-[88px] flex-col rounded-xl border px-1.5 py-1 ${
                highlight ? "border-moss/30 bg-moss/5" : "border-charcoal/8 bg-cream/40"
              }`}
            >
              <div className={`text-xs font-semibold ${highlight ? "text-charcoal" : "text-charcoal/55"}`}>{day}</div>
              <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                {list.slice(0, 3).map((slot) => (
                  <Link key={`${slot.id}-${day}`} href={slotHref(slot)}>
                    <a
                      className="truncate rounded bg-charcoal/5 px-1 py-0.5 font-mono-label text-[7px] uppercase tracking-[0.08em] text-charcoal/80 hover:bg-moss/15"
                      title={slotSubtitle(slot)}
                    >
                      {slot.sessions.length > 1
                        ? `${formatTime12(slot.startMinutes)} · ${slot.sessions.length} classes`
                        : `${formatTime12(slot.startMinutes)} · ${slot.sessions[0].shortLabel}`}
                    </a>
                  </Link>
                ))}
                {list.length > 3 ? (
                  <span className="font-mono-label text-[7px] text-charcoal/40">+{list.length - 3} more</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 font-body text-xs text-charcoal/55">
        Monthly view shows recurring weekly classes. Parallel sessions are grouped into shared slots so Tuesday and Friday youth blocks read as one time window instead of fragmented pills.
      </p>
    </div>
  );
}

function AgendaCards({ sessions }: { sessions: NormalizedSession[] }) {
  const grouped = DAY_LABELS.map((label, dayIndex) => ({
    label,
    slots: groupSessionsIntoSlots(sessions.filter((session) => session.dayIndex === dayIndex)),
  })).filter((group) => group.slots.length > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {grouped.map((group) => (
        <div key={group.label} className="rounded-[1.8rem] border border-charcoal/10 bg-white p-4 shadow-[0_18px_45px_rgba(26,26,26,0.06)]">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">{group.label}</div>
          <div className="mt-3 space-y-3">
            {group.slots.map((slot) => (
              <Link key={slot.id} href={slotHref(slot)}>
                <a className="block rounded-2xl border border-charcoal/8 bg-cream/45 p-3 transition hover:border-charcoal/18 hover:bg-cream/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-heading text-base text-charcoal">{slotTitle(slot)}</div>
                      {slot.sessions.length === 1 ? (
                        <div className="mt-1 text-sm text-charcoal/65">{slot.sessions[0].label}</div>
                      ) : (
                        <div className="mt-2 space-y-1.5">
                          {slot.sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between gap-2 rounded-xl border border-charcoal/8 bg-white/75 px-2.5 py-1.5">
                              <span className="text-sm text-charcoal/72">{session.shortLabel}</span>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-mono-label uppercase tracking-[0.14em] ${TRACK_STYLES[session.track].chip}`}>
                                {session.track}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {slot.sessions.length > 1 ? (
                      <div className="shrink-0 rounded-full border border-charcoal/10 bg-white/80 px-2.5 py-1 text-[9px] font-mono-label uppercase tracking-[0.14em] text-charcoal/55">
                        {slot.sessions.length} classes
                      </div>
                    ) : (
                      <div className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-mono-label uppercase tracking-[0.16em] ${TRACK_STYLES[slot.sessions[0].track].chip}`}>
                        {slot.sessions[0].track}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 font-mono-label text-[10px] uppercase tracking-[0.16em] text-clay">
                    {formatTime12(slot.startMinutes)} – {formatTime12(slot.endMinutes)}
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const Schedule = () => {
  const [view, setView] = useState<ViewMode>("weekly");
  const [filter, setFilter] = useState<ScheduleTrack | "all">("all");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  const filtered = useMemo(
    () => NORMALIZED_SESSIONS.filter((s) => sessionMatchesFilter(s, filter)),
    [filter],
  );

  const shiftWeek = (delta: number) => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + delta * 7);
    setWeekAnchor(d);
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(monthAnchor);
    d.setMonth(d.getMonth() + delta);
    setMonthAnchor(d);
  };

  const monthTitle = monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />

      <StudioBlock id="schedule.header" label="Header" page="Schedule">
        <header className="mx-auto max-w-6xl px-6 pt-28 pb-10">
          <SectionHeader eyebrow="Class Schedule" title="Weekly class schedule" className="mb-6" />
          <p className="max-w-2xl font-body text-sm leading-relaxed text-charcoal/70">
            <StudioText
              k="schedule.header.description"
              defaultText="See the live weekly class times, then decide whether you want to start with a free trial or open your Family & Member Account for BJJ registration. The other programs are still in coming-soon mode."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </header>
      </StudioBlock>

      <StudioBlock id="schedule.calendar" label="Calendar" page="Schedule">
        <main className="mx-auto max-w-6xl px-6">
          <MotionDiv delay={0.02}>
            <PremiumCard className="mb-8 border border-clay/20 bg-cream">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 flex-none text-clay" size={16} />
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
                    Tuesday youth blocks
                  </div>
                  <p className="mt-1 font-body text-sm text-charcoal/75">
                    Women 11+ train <strong>12:30 to 2:00 PM</strong>. Girls 5–10 and boys 7–13 train <strong>2:30 to 3:30 PM</strong>.
                    The weekly view now groups simultaneous classes into one shared time slot so parallel sessions stay legible. Women
                    Tuesday and Thursday are separate enrollments, so tuition stays tied to the exact day you choose.
                  </p>
                </div>
              </div>
            </PremiumCard>
          </MotionDiv>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {TRACK_FILTERS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFilter(t.value)}
                  className={`rounded-full border px-4 py-1.5 font-mono-label text-[10px] uppercase tracking-[0.16em] transition ${
                    filter === t.value
                      ? "border-moss bg-moss/15 text-charcoal"
                      : "border-charcoal/15 bg-white text-charcoal/60 hover:border-charcoal/25"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-full border border-charcoal/10 bg-white p-1">
              {(["weekly", "monthly"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-full px-4 py-1.5 font-mono-label text-[10px] uppercase tracking-[0.18em] transition-colors transition-transform duration-150 ease-out active:scale-[0.98] motion-safe:transform-gpu ${
                    view === v ? "bg-clay text-cream shadow-sm" : "text-charcoal/60 hover:text-charcoal"
                  }`}
                >
                  {v === "weekly" ? "Week" : "Month"}
                </button>
              ))}
            </div>
          </div>

          {view === "weekly" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                  Time grid · scroll horizontally on small screens
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shiftWeek(-1)}
                    className="rounded-full border border-charcoal/15 p-2 text-charcoal hover:bg-white"
                    aria-label="Previous week"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekAnchor(new Date())}
                    className="rounded-full border border-charcoal/15 px-3 py-1.5 font-mono-label text-[10px] uppercase tracking-[0.16em] text-charcoal hover:bg-white"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => shiftWeek(1)}
                    className="rounded-full border border-charcoal/15 p-2 text-charcoal hover:bg-white"
                    aria-label="Next week"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div data-testid="schedule-weekly-view">
                <WeekGrid sessions={filtered} weekAnchor={weekAnchor} />
              </div>
              <AgendaCards sessions={filtered} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-heading text-xl text-charcoal">{monthTitle}</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="rounded-full border border-charcoal/15 p-2 text-charcoal hover:bg-white"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthAnchor(new Date())}
                    className="rounded-full border border-charcoal/15 px-3 py-1.5 font-mono-label text-[10px] uppercase tracking-[0.16em] text-charcoal hover:bg-white"
                  >
                    This month
                  </button>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="rounded-full border border-charcoal/15 p-2 text-charcoal hover:bg-white"
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <MonthGrid sessions={filtered} monthAnchor={monthAnchor} />
              <AgendaCards sessions={filtered} />
            </div>
          )}

          <StudioBlock id="schedule.alert" label="Alert" page="Schedule">
            <MotionDiv delay={0.08}>
              <div className="mt-8">
                <PremiumCard className="border border-charcoal/10 bg-cream">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 flex-none text-clay" size={16} />
                    <p className="font-body text-sm text-charcoal/70">
                      <StudioText
                        k="schedule.alert.weather"
                        defaultText="Classes may be adjusted for weather. Indoor alternatives are available when needed."
                        as="span"
                        className="inline"
                        multiline
                      />
                    </p>
                  </div>
                </PremiumCard>
              </div>
            </MotionDiv>
          </StudioBlock>
        </main>
      </StudioBlock>

      <StudioBlock id="schedule.cta" label="Contact CTA" page="Schedule">
        <div className="mx-auto mt-12 max-w-6xl px-6">
          <MotionDiv delay={0.08}>
            <DarkCard className="rounded-3xl py-12 text-center">
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
                <OutlineButton asChild className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em] border-cream/20 text-cream hover:bg-cream/10">
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
