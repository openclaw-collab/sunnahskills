import { useState } from "react";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

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
    <MotionDiv delay={index * 0.04}>
      <StudioBlock id={`schedule.${row.slug}.${scope}.${index}`} label={`${row.program} ${scope}`} page="Schedule">
        <div className="group flex items-center justify-between gap-4 rounded-xl border border-charcoal/8 bg-cream px-4 py-3 transition-colors hover:bg-charcoal/[0.03]">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex-none">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                <StudioText k={`schedule.${row.slug}.${scope}.${index}.day`} defaultText={row.day} as="span" className="inline" />
              </div>
              <div className="mt-0.5 font-mono-label text-[11px] text-charcoal/80">
                <StudioText k={`schedule.${row.slug}.${scope}.${index}.time`} defaultText={row.time} as="span" className="inline" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="truncate font-body text-sm text-charcoal">
                <StudioText k={`schedule.${row.slug}.${scope}.${index}.program`} defaultText={row.program} as="span" className="inline" />
              </div>
              <div className="mt-0.5 font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/40">
                <StudioText k={`schedule.${row.slug}.${scope}.${index}.ages`} defaultText={`Ages ${row.ages}`} as="span" className="inline" />
              </div>
            </div>
          </div>
          <Link href={`/programs/${row.slug}/register`}>
            <span className="flex-none whitespace-nowrap font-mono-label text-[9px] uppercase tracking-[0.15em] text-clay opacity-0 transition-opacity group-hover:opacity-100">
              Register →
            </span>
          </Link>
        </div>
      </StudioBlock>
    </MotionDiv>
  );
}

const Schedule = () => {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
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
          <MotionDiv delay={0.02}>
            <PremiumCard className="mb-8 border border-clay/20 bg-cream">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 flex-none text-clay" size={16} />
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
                    <StudioText k="schedule.break.title" defaultText="Classes Currently On Break" as="span" className="inline" />
                  </div>
                  <p className="mt-1 font-body text-sm text-charcoal/75">
                    <StudioText k="schedule.break.description" defaultText="Classes resume Monday, March 31st, 2026." as="span" className="inline" />
                  </p>
                </div>
              </div>
            </PremiumCard>
          </MotionDiv>

          <div className="mb-8 flex items-center justify-between">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/40">
              Interactive Calendar
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
                  {v}
                </button>
              ))}
            </div>
          </div>

          {view === "weekly" ? (
            <div className="space-y-6">
              <StudioBlock id="schedule.bjj" label="BJJ" page="Schedule">
                <MotionDiv delay={0.02}>
                  <PremiumCard className="bg-white border border-charcoal/10">
                    <div className="mb-5 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-moss" />
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
                </MotionDiv>
              </StudioBlock>

              <StudioBlock id="schedule.bjj.girls" label="Girls" page="Schedule">
                <MotionDiv delay={0.06}>
                  <PremiumCard className="bg-white border border-charcoal/10">
                    <div className="mb-5 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-clay" />
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
                </MotionDiv>
              </StudioBlock>

              <StudioBlock id="schedule.mixed" label="Mixed Programs" page="Schedule">
                <MotionDiv delay={0.1}>
                  <PremiumCard className="bg-white border border-charcoal/10">
                    <div className="mb-5 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-charcoal/40" />
                      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                        <StudioText k="schedule.mixed.title" defaultText="Mixed Programs - Boys & Girls" as="span" className="inline" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {mixedPrograms.map((row, i) => (
                        <MotionDiv key={i} delay={i * 0.04}>
                          <StudioBlock id={`schedule.${row.slug}.mixed.${i}`} label={row.program} page="Schedule">
                            <div className="group flex items-center justify-between gap-4 rounded-xl border border-charcoal/8 bg-cream px-4 py-3 transition-colors hover:bg-charcoal/[0.03]">
                              <div className="flex min-w-0 items-center gap-4">
                                <div className="flex-none">
                                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                                    <StudioText k={`schedule.${row.slug}.mixed.${i}.day`} defaultText={row.day} as="span" className="inline" />
                                  </div>
                                  <div className="mt-0.5 font-mono-label text-[11px] text-charcoal/80">
                                    <StudioText k={`schedule.${row.slug}.mixed.${i}.time`} defaultText={row.time} as="span" className="inline" />
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-body text-sm text-charcoal">
                                    <StudioText k={`schedule.${row.slug}.mixed.${i}.program`} defaultText={row.program} as="span" className="inline" />
                                  </div>
                                  <div className="mt-0.5 font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/40">
                                    <StudioText k={`schedule.${row.slug}.mixed.${i}.meta`} defaultText={`Ages ${row.ages} · ${row.frequency}`} as="span" className="inline" />
                                  </div>
                                </div>
                              </div>
                              <Link href={`/programs/${row.slug}/register`}>
                                <span className="flex-none whitespace-nowrap font-mono-label text-[9px] uppercase tracking-[0.15em] text-clay opacity-0 transition-opacity group-hover:opacity-100">
                                  Register →
                                </span>
                              </Link>
                            </div>
                          </StudioBlock>
                        </MotionDiv>
                      ))}
                    </div>
                  </PremiumCard>
                </MotionDiv>
              </StudioBlock>
            </div>
          ) : (
            <MotionDiv delay={0.18}>
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-heading text-lg text-charcoal">
                    <StudioText k="schedule.monthly.title" defaultText="March 2026" as="span" className="inline" />
                  </div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/40">
                    <StudioText k="schedule.monthly.label" defaultText="Monthly view" as="span" className="inline" />
                  </div>
                </div>
                <div className="mb-2 grid grid-cols-7 gap-2 font-mono-label text-[10px] uppercase tracking-[0.12em] text-charcoal/40">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-[10px]">
                  {monthDays.map((day) => (
                    <div
                      key={day}
                      className={`flex aspect-[4/5] flex-col justify-between rounded-xl border px-1.5 py-1 ${
                        day === 31 ? "border-moss/20 bg-moss/5" : "border-charcoal/5 bg-cream"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${day === 31 ? "text-charcoal" : "text-charcoal/50"}`}>
                          {day}
                        </span>
                      </div>
                      {day === 31 ? (
                        <div className="mt-1 space-y-0.5">
                          <div className="rounded bg-moss/15 px-1 py-0.5 text-[8px] leading-tight text-charcoal">
                            <StudioText k="schedule.monthly.day31.women" defaultText="Women's BJJ" as="span" className="inline" />
                          </div>
                          <div className="rounded bg-clay/15 px-1 py-0.5 text-[8px] leading-tight text-charcoal">
                            <StudioText k="schedule.monthly.day31.boys" defaultText="Kids BJJ (Boys)" as="span" className="inline" />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto text-[8px] leading-tight text-charcoal/30">
                          <StudioText k="schedule.monthly.break" defaultText="Break" as="span" className="inline" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </PremiumCard>
            </MotionDiv>
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
                        defaultText="Classes may be adjusted based on weather conditions. Indoor alternatives are available when needed."
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

      {/* CONTACT CTA */}
      <StudioBlock id="schedule.cta" label="Contact CTA" page="Schedule">
        <div className="max-w-6xl mx-auto px-6 mt-12">
          <MotionDiv delay={0.08}>
            <DarkCard className="rounded-3xl text-center py-12">
              <div className="mb-4 font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss">
                <StudioText k="schedule.cta.eyebrow" defaultText="Questions" as="span" className="inline" />
              </div>
              <h2 className="mb-3 font-heading text-2xl text-cream">
                <StudioText k="schedule.cta.title" defaultText="Have Questions About Our Schedule?" as="span" className="inline" />
              </h2>
              <p className="mx-auto mb-8 max-w-md font-body text-sm text-cream/60">
                <StudioText
                  k="schedule.cta.description"
                  defaultText="Contact us for more information about class times, registration, or to schedule a trial session."
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
