import React from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
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
            Payment was cancelled, so registration is not finished yet. Return to checkout when you’re ready to try again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ClayButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/registration/cart">Return to Checkout</Link>
            </ClayButton>
            <OutlineButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/programs">Back to Programs</Link>
            </OutlineButton>
          </div>
          </PremiumCard>
        </MotionDiv>
      </main>
    </MotionPage>
  );
}
