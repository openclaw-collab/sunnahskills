import { Link } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { PROGRAMS, getProgramTypeLabel } from "@/lib/programConfig";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

const RegistrationHub = () => {
  const programs = Object.values(PROGRAMS);

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Registration" title="Choose a Program" className="mb-8" />
        <p className="font-body text-pretty text-sm text-charcoal/70 max-w-2xl mb-6">
          Start by selecting a program below. Each registration flow is tailored to that discipline and will guide you
          through student details, waivers, and payment.
        </p>
        <p className="font-body text-pretty text-xs text-charcoal/55 max-w-2xl mb-10">
          Use the{" "}
          <Link href="/registration/cart" className="text-moss underline-offset-2 hover:underline">
            family cart
          </Link>{" "}
          to combine multiple students or class lines in one checkout (BJJ only).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((program, index) => (
            <MotionDiv key={program.slug} delay={index * 0.04}>
              <PremiumCard className="bg-white border border-charcoal/10 flex flex-col justify-between">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                    {getProgramTypeLabel(program.type)}
                  </div>
                  <h2 className="font-heading text-2xl text-charcoal">{program.name}</h2>
                  <p className="mt-2 font-body text-xs text-charcoal/60 uppercase tracking-[0.16em]">
                    {program.ageRangeLabel}
                  </p>
                  <p className="mt-4 font-body text-sm text-charcoal/70 leading-relaxed text-pretty">
                    {program.shortPitch}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50">
                    Registration Flow
                  </div>
                  {program.enrollmentStatus === "open" ? (
                    <ClayButton asChild className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                      <Link href={program.registerPath}>
                        Register for {program.slug === "bjj" ? "BJJ" : program.name}
                      </Link>
                    </ClayButton>
                  ) : (
                    <OutlineButton asChild className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                      <Link href={`/contact?interest=${program.slug}`}>Join waitlist</Link>
                    </OutlineButton>
                  )}
                </div>
              </PremiumCard>
            </MotionDiv>
          ))}
        </div>
      </main>
    </MotionPage>
  );
};

export default RegistrationHub;
