import React from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { Link } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

export default function RegistrationPending() {
  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-4xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Status" title="Pending Payment" className="mb-10" />
        <MotionDiv delay={0.04}>
          <PremiumCard className="bg-white border border-charcoal/10">
          <p className="font-body text-sm text-charcoal/70 leading-relaxed">
            Your payment is still processing. If this page does not update, return to checkout or contact us and we’ll confirm the status.
          </p>
          <div className="mt-8">
            <ClayButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/registration/cart">Return to Checkout</Link>
            </ClayButton>
          </div>
          </PremiumCard>
        </MotionDiv>
      </main>
    </MotionPage>
  );
}
