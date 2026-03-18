import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { TelemetryCard } from "@/components/brand/TelemetryCard";

const Schedule = () => {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  const boysSchedule = [
    { day: "Monday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6-10" },
    { day: "Monday", time: "5:15 PM", program: "BJJ Advanced", ages: "11-17" },
    { day: "Wednesday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6-10" },
    { day: "Wednesday", time: "5:15 PM", program: "BJJ Advanced", ages: "11-17" },
    { day: "Saturday", time: "9:00 AM", program: "Outdoor Workshop", ages: "8-16" },
    { day: "Saturday", time: "11:00 AM", program: "Archery (Seasonal)", ages: "10-17" },
  ];

  const girlsSchedule = [
    { day: "Tuesday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6-10" },
    { day: "Tuesday", time: "5:15 PM", program: "BJJ Advanced", ages: "11-17" },
    { day: "Thursday", time: "4:00 PM", program: "BJJ Fundamentals", ages: "6-10" },
    { day: "Thursday", time: "5:15 PM", program: "BJJ Advanced", ages: "11-17" },
    { day: "Sunday", time: "9:00 AM", program: "Outdoor Workshop", ages: "8-16" },
    { day: "Sunday", time: "11:00 AM", program: "Archery (Seasonal)", ages: "10-17" },
  ];

  const mixedPrograms = [
    { day: "Friday", time: "6:00 PM", program: "Bullyproofing Workshop", ages: "8-14", frequency: "Monthly" },
  ];

  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Schedule" title="Weekly Program Times" className="mb-10" />
        <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-6">
          All classes are held at our training locations. Seasonal programs and workshops may vary by date; the
          calendar view gives you a quick sense of when the academy is active.
        </p>

        <PremiumCard className="bg-cream border border-charcoal/10 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-clay mt-0.5" size={18} />
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay">
                  Classes Currently On Break
                </div>
                <p className="font-body text-sm text-charcoal/75 mt-1">
                  Reason: Break – Classes resume March 31st.
                </p>
                <p className="font-body text-xs text-charcoal/60 mt-1">
                  Classes Resume: Monday, March 30, 2026
                </p>
              </div>
            </div>
          </div>
        </PremiumCard>

        <div className="flex items-center justify-between mb-6">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
            Interactive Calendar
          </div>
          <div className="inline-flex rounded-full border border-charcoal/10 bg-white p-1 text-[11px] font-mono-label uppercase tracking-[0.18em]">
            <button
              type="button"
              onClick={() => setView("weekly")}
              className={`px-3 py-1 rounded-full ${
                view === "weekly" ? "bg-charcoal text-cream" : "text-charcoal/70"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setView("monthly")}
              className={`px-3 py-1 rounded-full ${
                view === "monthly" ? "bg-charcoal text-cream" : "text-charcoal/70"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {view === "weekly" ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Boys&apos; Classes
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {boysSchedule.map((item, idx) => (
                    <TelemetryCard
                      key={`${item.day}-${item.time}-${idx}`}
                      title={`${item.day} · ${item.time}`}
                      label={item.ages}
                    >
                      {item.program}
                    </TelemetryCard>
                  ))}
                </div>
              </PremiumCard>

              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Girls&apos; Classes
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {girlsSchedule.map((item, idx) => (
                    <TelemetryCard
                      key={`${item.day}-${item.time}-${idx}`}
                      title={`${item.day} · ${item.time}`}
                      label={item.ages}
                    >
                      {item.program}
                    </TelemetryCard>
                  ))}
                </div>
              </PremiumCard>
            </div>

            <div className="mt-6">
              <PremiumCard className="bg-white border border-charcoal/10">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                  Mixed Programs (Boys &amp; Girls)
                </div>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {mixedPrograms.map((item, idx) => (
                    <TelemetryCard
                      key={`${item.day}-${item.time}-${idx}`}
                      title={`${item.day} · ${item.time}`}
                      label={item.frequency}
                    >
                      {item.program} · Ages {item.ages}
                    </TelemetryCard>
                  ))}
                </div>
              </PremiumCard>
            </div>
          </>
        ) : (
          <PremiumCard className="bg-white border border-charcoal/10 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-heading text-lg text-charcoal">March 2026</div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
                View by month
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs font-mono-label uppercase tracking-[0.18em] text-charcoal/40 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-[11px]">
              {monthDays.map((day) => (
                <div
                  key={day}
                  className="aspect-[4/5] rounded-xl border border-charcoal/5 bg-cream px-2 py-1 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-charcoal/60">
                    <span className="font-semibold text-xs">{day}</span>
                    <span className="text-[9px] text-charcoal/40">Closed</span>
                  </div>
                  {day === 31 && (
                    <div className="mt-1 space-y-1">
                      <div className="rounded-md bg-moss/10 px-1.5 py-0.5 text-[9px] text-charcoal">
                        Womens BJJ (Women)
                      </div>
                      <div className="rounded-md bg-clay/10 px-1.5 py-0.5 text-[9px] text-charcoal">
                        Kids BJJ (Boys)
                      </div>
                    </div>
                  )}
                  <div className="mt-auto pt-2 text-[9px] text-clay/80">
                    {day <= 30 ? "Break – Classes resume March 31st" : ""}
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>
        )}

        <div className="mt-8">
          <PremiumCard className="bg-cream border border-charcoal/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-clay mt-0.5" size={18} />
              <p className="font-body text-sm text-charcoal/70">
                Classes may be adjusted based on weather conditions. Indoor alternatives are available when needed.
              </p>
            </div>
          </PremiumCard>
        </div>
      </main>
    </div>
  );
};

export default Schedule;
