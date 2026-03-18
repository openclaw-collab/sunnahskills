import React from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { Link } from "wouter";

export default function RegistrationWaitlist() {
  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-4xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Waitlist" title="You’re on the Waitlist" className="mb-10" />
        <PremiumCard className="bg-white border border-charcoal/10">
          <p className="font-body text-sm text-charcoal/70 leading-relaxed">
            We’ve saved your request. When a spot opens, we’ll reach out with the next available session and payment
            link.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <ClayButton className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                Ask a Question
              </ClayButton>
            </Link>
          </div>
        </PremiumCard>
      </main>
    </div>
  );
}

