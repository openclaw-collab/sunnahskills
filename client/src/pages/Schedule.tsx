import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
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

function sessionMatchesFilter(s: NormalizedSession, f: ScheduleTrack | "all") {
  if (f === "all") return true;
  return s.track === f;
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
            const daySessions = sessions.filter((s) => s.dayIndex === dayIndex);
            return (
              <div key={col} className="relative border-l border-charcoal/10">
                {timeTicks.map((m) => (
                  <div
                    key={m}
                    className="pointer-events-none absolute left-0 right-0 border-t border-charcoal/[0.06]"
                    style={{ top: `${minutesToTopPct(m)}%` }}
                  />
                ))}
                {daySessions.map((s) => {
                  const top = minutesToTopPct(s.startMinutes);
                  const h = minutesToHeightPct(s.startMinutes, s.endMinutes);
                  return (
                    <Link key={s.id} href={registerHrefForSession(s)}>
                      <a
                        className="absolute left-1 right-1 z-[1] overflow-hidden rounded-xl border border-charcoal/15 bg-moss/10 px-2 py-1.5 text-left shadow-sm transition hover:bg-moss/20 hover:shadow-md"
                        style={{ top: `${top}%`, height: `${Math.max(h, 6)}%`, minHeight: "44px" }}
                        title={s.label}
                      >
                        <div className="font-mono-label text-[8px] uppercase tracking-[0.12em] text-charcoal/50">
                          {formatTime12(s.startMinutes)} – {formatTime12(s.endMinutes)}
                        </div>
                        <div className="mt-0.5 line-clamp-2 font-body text-[11px] font-medium leading-snug text-charcoal">
                          {s.shortLabel}
                        </div>
                        <div className="mt-0.5 font-mono-label text-[8px] uppercase tracking-[0.1em] text-clay">
                          {s.registerable ? "Register →" : "Details →"}
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

  const sessionsByWeekday = useMemo(() => {
    const map = new Map<number, NormalizedSession[]>();
    for (const s of sessions) {
      const list = map.get(s.dayIndex) ?? [];
      list.push(s);
      map.set(s.dayIndex, list);
    }
    return map;
  }, [sessions]);

  const today = new Date();
  const isThisMonth = today.getFullYear() === y && today.getMonth() === mo;

  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white p-4 md:p-6">
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
          const list = sessionsByWeekday.get(wd) ?? [];
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
                {list.slice(0, 3).map((s) => (
                  <Link key={`${s.id}-${day}`} href={registerHrefForSession(s)}>
                    <a
                      className="truncate rounded bg-charcoal/5 px-1 py-0.5 font-mono-label text-[7px] uppercase tracking-[0.08em] text-charcoal/80 hover:bg-moss/15"
                      title={s.label}
                    >
                      {s.shortLabel}
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
        Monthly view shows recurring weekly classes. Tuesday: women’s block ends before kids’ class — different rooms/tracks.
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
          <SectionHeader eyebrow="Class Schedule" title="Academy calendar" className="mb-6" />
          <p className="max-w-2xl font-body text-sm leading-relaxed text-charcoal/70">
            <StudioText
              k="schedule.header.description"
              defaultText="Weekly grid with real start/end times, plus a month overview for recurring classes. Brazilian Jiu-Jitsu enrollments are open; other programs are coming soon — use the link to join a waitlist or contact us."
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
                    Tuesday overlap
                  </div>
                  <p className="mt-1 font-body text-sm text-charcoal/75">
                    Women 11+ train <strong>12:30–2:00 PM</strong>; kids (girls/boys) train <strong>2:30–3:30 PM</strong> — same
                    day, different blocks, rooms, and tracks. Women Tuesday and Thursday are separate enrollments (double tuition
                    if you choose both).
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
              <WeekGrid sessions={filtered} weekAnchor={weekAnchor} />
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
                <StudioText k="schedule.cta.title" defaultText="Have Questions About Our Schedule?" as="span" className="inline" />
              </h2>
              <p className="mx-auto mb-8 max-w-md font-body text-sm text-cream/60">
                <StudioText
                  k="schedule.cta.description"
                  defaultText="Contact us for class times, registration, or to schedule a trial session."
                  as="span"
                  className="inline"
                  multiline
                />
              </p>
              <ClayButton asChild className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/contact">Contact Us</Link>
              </ClayButton>
            </DarkCard>
          </MotionDiv>
        </div>
      </StudioBlock>
    </MotionPage>
  );
};

export default Schedule;
