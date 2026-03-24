import React from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { Link } from "wouter";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

export default function RegistrationCancel() {
  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-4xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Payment" title="Payment Cancelled" className="mb-10" />
        <MotionDiv delay={0.04}>
          <PremiumCard className="bg-white border border-charcoal/10">
          <p className="font-body text-sm text-charcoal/70 leading-relaxed">
            Your payment was cancelled. Your registration may still be saved as pending—return to the registration flow
            to complete payment.
          </p>
          <div className="mt-8">
            <ClayButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/programs">Back to Programs</Link>
            </ClayButton>
          </div>
          </PremiumCard>
        </MotionDiv>
      </main>
    </MotionPage>
  );
}
