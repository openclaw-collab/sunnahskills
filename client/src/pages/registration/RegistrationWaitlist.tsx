import React from "react";
import { Link, useSearch } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";

export default function RegistrationWaitlist() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const position = params.get("pos") ?? "1";
  const programName = params.get("program") ? decodeURIComponent(params.get("program")!) : "this program";

  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-2xl mx-auto px-6 pt-28">

        {/* Position number */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-charcoal/40 mb-2">
              Waitlist position
            </div>
            <div className="w-24 h-24 rounded-full bg-charcoal/5 border-2 border-charcoal/15 flex items-center justify-center">
              <span className="font-heading text-4xl text-charcoal"># {position}</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-clay mb-3">
            Session Full
          </div>
          <h1 className="font-heading text-4xl text-charcoal mb-3">
            You're on the waitlist.
          </h1>
          <p className="font-body text-sm text-charcoal/60 max-w-sm mx-auto">
            You're position {position} on the waitlist for {programName}. We'll email you as soon as a spot opens up.
          </p>
        </div>

        <DarkCard className="rounded-3xl mb-6">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-5">
            What to expect
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="font-mono-label text-[11px] text-clay flex-none mt-0.5">01</div>
              <div>
                <div className="font-body text-sm text-cream/90 font-medium mb-1">We'll email you when a spot opens</div>
                <p className="font-body text-xs text-cream/55 leading-relaxed">
                  You'll get an email with a registration link and a 48-hour window to confirm your spot.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="font-mono-label text-[11px] text-clay flex-none mt-0.5">02</div>
              <div>
                <div className="font-body text-sm text-cream/90 font-medium mb-1">No payment needed now</div>
                <p className="font-body text-xs text-cream/55 leading-relaxed">
                  We won't charge you until your spot is confirmed. Nothing to do in the meantime.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="font-mono-label text-[11px] text-clay flex-none mt-0.5">03</div>
              <div>
                <div className="font-body text-sm text-cream/90 font-medium mb-1">Explore other programs</div>
                <p className="font-body text-xs text-cream/55 leading-relaxed">
                  Other programs may have open spots — check the schedule or contact us to explore options.
                </p>
              </div>
            </div>
          </div>
        </DarkCard>

        <PremiumCard className="bg-white border border-charcoal/10">
          <p className="font-body text-sm text-charcoal/60 mb-5">
            Have questions or want to explore other programs?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/programs">
              <ClayButton className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                View All Programs
              </ClayButton>
            </Link>
            <Link href="/contact">
              <button
                type="button"
                className="px-7 py-3.5 rounded-full border border-charcoal/20 text-charcoal/70 text-[11px] font-mono-label uppercase tracking-[0.18em] hover:bg-charcoal hover:text-cream transition-colors"
              >
                Contact Us
              </button>
            </Link>
          </div>
        </PremiumCard>
      </main>
    </div>
  );
}
