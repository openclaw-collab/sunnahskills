import React from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { Link } from "wouter";

export default function RegistrationSuccess() {
  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-4xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Confirmation" title="Registration Complete" className="mb-10" />
        <PremiumCard className="bg-white border border-charcoal/10">
          <p className="font-body text-sm text-charcoal/70 leading-relaxed">
            Your registration has been received and payment was confirmed. You’ll receive an email with next steps,
            what-to-bring, and session details.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/programs">
              <ClayButton className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
                Explore Programs
              </ClayButton>
            </Link>
            <Link href="/contact">
              <ClayButton className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] bg-moss hover:bg-moss/90">
                Contact Us
              </ClayButton>
            </Link>
          </div>
        </PremiumCard>
      </main>
    </div>
  );
}

