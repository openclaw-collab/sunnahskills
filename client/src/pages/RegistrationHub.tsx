import { Link } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { PROGRAMS } from "@/lib/programConfig";

const RegistrationHub = () => {
  const programs = Object.values(PROGRAMS);

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Registration" title="Choose a Program" className="mb-8" />
        <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-10">
          Start by selecting a program below. Each registration flow is tailored to that discipline and will guide you
          through student details, waivers, and payment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((program) => (
            <PremiumCard key={program.slug} className="bg-white border border-charcoal/10 flex flex-col justify-between">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                  {program.type === "recurring"
                    ? "Recurring Enrollment"
                    : program.type === "seasonal"
                    ? "Seasonal Program"
                    : program.type === "workshop"
                    ? "Workshop-Based"
                    : "Short Series"}
                </div>
                <h2 className="font-heading text-2xl text-charcoal">{program.name}</h2>
                <p className="mt-2 font-body text-xs text-charcoal/60 uppercase tracking-[0.16em]">
                  {program.ageRangeLabel}
                </p>
                <p className="mt-4 font-body text-sm text-charcoal/70 leading-relaxed">{program.shortPitch}</p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50">
                  Registration Flow
                </div>
                <Link href={program.registerPath}>
                  <ClayButton className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                    Register for {program.slug === "bjj" ? "BJJ" : program.name}
                  </ClayButton>
                </Link>
              </div>
            </PremiumCard>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RegistrationHub;

