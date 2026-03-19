import { useState } from "react";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

type ScheduleRow = { day: string; time: string; program: string; ages: string; slug: string };

const boysSchedule: ScheduleRow[] = [
  { day: "Monday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6–10", slug: "bjj" },
  { day: "Monday", time: "5:15 PM", program: "BJJ Advanced", ages: "11–17", slug: "bjj" },
  { day: "Wednesday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6–10", slug: "bjj" },
  { day: "Wednesday", time: "5:15 PM", program: "BJJ Advanced", ages: "11–17", slug: "bjj" },
  { day: "Saturday", time: "9:00 AM", program: "Outdoor Workshop", ages: "8–16", slug: "outdoor" },
  { day: "Saturday", time: "11:00 AM", program: "Archery (Seasonal)", ages: "10–17", slug: "archery" },
];

const girlsSchedule: ScheduleRow[] = [
  { day: "Tuesday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6–10", slug: "bjj" },
  { day: "Tuesday", time: "5:15 PM", program: "BJJ Advanced", ages: "11–17", slug: "bjj" },
  { day: "Thursday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6–10", slug: "bjj" },
  { day: "Thursday", time: "5:15 PM", program: "BJJ Advanced", ages: "11–17", slug: "bjj" },
  { day: "Sunday", time: "9:00 AM", program: "Outdoor Workshop", ages: "8–16", slug: "outdoor" },
  { day: "Sunday", time: "11:00 AM", program: "Archery (Seasonal)", ages: "10–17", slug: "archery" },
];

type MixedRow = ScheduleRow & { frequency: string };
const mixedPrograms: MixedRow[] = [
  { day: "Friday", time: "6:00 PM", program: "Bullyproofing Workshop", ages: "8–14", slug: "bullyproofing", frequency: "Monthly" },
];

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

function ScheduleRow({ row, scope, index }: { row: ScheduleRow; scope: "boys" | "girls"; index: number }) {
  return (
    <StudioBlock id={`schedule.${row.slug}.${scope}.${index}`} label={`${row.program} ${scope}`} page="Schedule">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-charcoal/8 bg-cream px-4 py-3 hover:bg-charcoal/[0.03] transition-colors group">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-none">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
              <StudioText k={`schedule.${row.slug}.${scope}.${index}.day`} defaultText={row.day} as="span" className="inline" />
            </div>
            <div className="font-mono-label text-[11px] text-charcoal/80 mt-0.5">
              <StudioText k={`schedule.${row.slug}.${scope}.${index}.time`} defaultText={row.time} as="span" className="inline" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-body text-sm text-charcoal truncate">
              <StudioText k={`schedule.${row.slug}.${scope}.${index}.program`} defaultText={row.program} as="span" className="inline" />
            </div>
            <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/40 mt-0.5">
              <StudioText k={`schedule.${row.slug}.${scope}.${index}.ages`} defaultText={`Ages ${row.ages}`} as="span" className="inline" />
            </div>
          </div>
        </div>
        <Link href={`/programs/${row.slug}/register`}>
          <span className="flex-none font-mono-label text-[9px] uppercase tracking-[0.15em] text-clay opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Register →
          </span>
        </Link>
      </div>
    </StudioBlock>
  );
}

const Schedule = () => {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />

      {/* PAGE HEADER */}
      <StudioBlock id="schedule.header" label="Header" page="Schedule">
        <header className="max-w-6xl mx-auto px-6 pt-28 pb-10">
          <SectionHeader
            eyebrow="Class Schedule"
            title="Weekly Program Times"
            className="mb-6"
          />
          <p className="font-body text-sm text-charcoal/70 max-w-2xl leading-relaxed">
            <StudioText
              k="schedule.header.description"
              defaultText="Find the perfect class for you and your family. All classes are held at our training locations. Seasonal programs and workshops may vary by date."
              as="span"
              className="inline"
              multiline
            />
          </p>
        </header>
      </StudioBlock>

      <StudioBlock id="schedule.calendar" label="Calendar" page="Schedule">
        <main className="max-w-6xl mx-auto px-6">

          {/* Break alert */}
          <PremiumCard className="bg-cream border border-clay/20 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-clay mt-0.5 flex-none" size={16} />
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
                  <StudioText k="schedule.break.title" defaultText="Classes Currently On Break" as="span" className="inline" />
                </div>
                <p className="font-body text-sm text-charcoal/75 mt-1">
                  <StudioText k="schedule.break.description" defaultText="Classes resume Monday, March 31st, 2026." as="span" className="inline" />
                </p>
              </div>
            </div>
          </PremiumCard>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/40">
              Interactive Calendar
            </div>
            <div className="inline-flex rounded-full border border-charcoal/10 bg-white p-1">
              {(["weekly", "monthly"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-full font-mono-label text-[10px] uppercase tracking-[0.18em] transition-colors ${
                    view === v ? "bg-clay text-cream shadow-sm" : "text-charcoal/60 hover:text-charcoal"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {view === "weekly" ? (
            <div className="space-y-6">
              {/* Boys */}
              <StudioBlock id="schedule.bjj" label="BJJ" page="Schedule">
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-moss" />
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                      <StudioText k="schedule.bjj.boys.title" defaultText="Boys' Classes" as="span" className="inline" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {boysSchedule.map((row, i) => (
                      <ScheduleRow key={i} row={row} scope="boys" index={i} />
                    ))}
                  </div>
                </PremiumCard>
              </StudioBlock>

              {/* Girls */}
              <StudioBlock id="schedule.bjj.girls" label="Girls" page="Schedule">
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-clay" />
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
                      <StudioText k="schedule.bjj.girls.title" defaultText="Girls' Classes" as="span" className="inline" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {girlsSchedule.map((row, i) => (
                      <ScheduleRow key={i} row={row} scope="girls" index={i} />
                    ))}
                  </div>
                </PremiumCard>
              </StudioBlock>

              {/* Mixed */}
              <StudioBlock id="schedule.mixed" label="Mixed Programs" page="Schedule">
                <PremiumCard className="bg-white border border-charcoal/10">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-charcoal/40" />
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                      <StudioText k="schedule.mixed.title" defaultText="Mixed Programs - Boys & Girls" as="span" className="inline" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {mixedPrograms.map((row, i) => (
                      <StudioBlock id={`schedule.${row.slug}.mixed.${i}`} label={row.program} page="Schedule" key={i}>
                        <div className="flex items-center justify-between gap-4 rounded-xl border border-charcoal/8 bg-cream px-4 py-3 hover:bg-charcoal/[0.03] transition-colors group">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="flex-none">
                              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                                <StudioText k={`schedule.${row.slug}.mixed.${i}.day`} defaultText={row.day} as="span" className="inline" />
                              </div>
                              <div className="font-mono-label text-[11px] text-charcoal/80 mt-0.5">
                                <StudioText k={`schedule.${row.slug}.mixed.${i}.time`} defaultText={row.time} as="span" className="inline" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-body text-sm text-charcoal truncate">
                                <StudioText k={`schedule.${row.slug}.mixed.${i}.program`} defaultText={row.program} as="span" className="inline" />
                              </div>
                              <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/40 mt-0.5">
                                <StudioText k={`schedule.${row.slug}.mixed.${i}.meta`} defaultText={`Ages ${row.ages} · ${row.frequency}`} as="span" className="inline" />
                              </div>
                            </div>
                          </div>
                          <Link href={`/programs/${row.slug}/register`}>
                            <span className="flex-none font-mono-label text-[9px] uppercase tracking-[0.15em] text-clay opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Register →
                            </span>
                          </Link>
                        </div>
                      </StudioBlock>
                    ))}
                  </div>
                </PremiumCard>
              </StudioBlock>
            </div>
          ) : (
            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="flex items-center justify-between mb-4">
                <div className="font-heading text-lg text-charcoal">
                  <StudioText k="schedule.monthly.title" defaultText="March 2026" as="span" className="inline" />
                </div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/40">
                  <StudioText k="schedule.monthly.label" defaultText="Monthly view" as="span" className="inline" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-[10px] font-mono-label uppercase tracking-[0.12em] text-charcoal/40 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-[10px]">
                {monthDays.map((day) => (
                  <div
                    key={day}
                    className={`aspect-[4/5] rounded-xl border px-1.5 py-1 flex flex-col justify-between ${
                      day === 31
                        ? "border-moss/20 bg-moss/5"
                        : "border-charcoal/5 bg-cream"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-xs ${day === 31 ? "text-charcoal" : "text-charcoal/50"}`}>
                        {day}
                      </span>
                    </div>
                    {day === 31 ? (
                      <div className="mt-1 space-y-0.5">
                        <div className="rounded bg-moss/15 px-1 py-0.5 text-[8px] text-charcoal leading-tight">
                          <StudioText k="schedule.monthly.day31.women" defaultText="Women's BJJ" as="span" className="inline" />
                        </div>
                        <div className="rounded bg-clay/15 px-1 py-0.5 text-[8px] text-charcoal leading-tight">
                          <StudioText k="schedule.monthly.day31.boys" defaultText="Kids BJJ (Boys)" as="span" className="inline" />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto text-[8px] text-charcoal/30 leading-tight">
                        <StudioText k="schedule.monthly.break" defaultText="Break" as="span" className="inline" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PremiumCard>
          )}

          {/* Weather alert */}
          <StudioBlock id="schedule.alert" label="Alert" page="Schedule">
            <div className="mt-8">
              <PremiumCard className="bg-cream border border-charcoal/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-clay mt-0.5 flex-none" size={16} />
                  <p className="font-body text-sm text-charcoal/70">
                    <StudioText
                      k="schedule.alert.weather"
                      defaultText="Classes may be adjusted based on weather conditions. Indoor alternatives are available when needed."
                      as="span"
                      className="inline"
                      multiline
                    />
                  </p>
                </div>
              </PremiumCard>
            </div>
          </StudioBlock>
        </main>
      </StudioBlock>

      {/* CONTACT CTA */}
      <StudioBlock id="schedule.cta" label="Contact CTA" page="Schedule">
        <div className="max-w-6xl mx-auto px-6 mt-12">
          <DarkCard className="rounded-3xl text-center py-12">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-4">
              <StudioText k="schedule.cta.eyebrow" defaultText="Questions" as="span" className="inline" />
            </div>
            <h2 className="font-heading text-2xl text-cream mb-3">
              <StudioText k="schedule.cta.title" defaultText="Have Questions About Our Schedule?" as="span" className="inline" />
            </h2>
            <p className="font-body text-sm text-cream/60 max-w-md mx-auto mb-8">
              <StudioText
                k="schedule.cta.description"
                defaultText="Contact us for more information about class times, registration, or to schedule a trial session."
                as="span"
                className="inline"
                multiline
              />
            </p>
            <Link href="/contact">
              <ClayButton className="px-8 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                Contact Us
              </ClayButton>
            </Link>
          </DarkCard>
        </div>
      </StudioBlock>
    </div>
  );
};

export default Schedule;
