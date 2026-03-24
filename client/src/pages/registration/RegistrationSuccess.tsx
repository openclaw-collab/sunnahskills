import React from "react";
import { Link, useSearch } from "wouter";
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";

const NEXT_STEPS = [
  {
    n: "01",
    title: "Placement confirmation",
    body: "We review your details and confirm your class group, session time, and age tier within 1–2 business days.",
  },
  {
    n: "02",
    title: "What-to-bring details",
    body: "You'll receive an email with everything you need: location, start time, gear list, and what to expect on day one.",
  },
  {
    n: "03",
    title: "First class",
    body: "Arrive 10 minutes early. Coaches will introduce themselves, walk you through the space, and get your child started.",
  },
];

export default function RegistrationSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const rid = params.get("rid");

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-2xl mx-auto px-6 pt-28">

        {/* Checkmark */}
        <MotionDiv delay={0.02} className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-clay/10 border-2 border-clay/30 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 16L13 23L26 9"
                stroke="#CE5833"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </MotionDiv>

        <MotionDiv delay={0.06} className="text-center mb-10">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-3">
            Registration Complete
          </div>
          <h1 className="font-heading text-4xl text-charcoal mb-3">
            You're enrolled.
          </h1>
          <p className="font-body text-sm text-charcoal/60 max-w-sm mx-auto">
            Payment confirmed. We'll be in touch with everything you need to get started.
          </p>
          {rid && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-4 py-2">
              <span className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/40">Reg ID</span>
              <span className="font-mono-label text-[11px] text-charcoal">#{rid}</span>
            </div>
          )}
        </MotionDiv>

        {/* What happens next */}
        <MotionDiv delay={0.1}>
          <DarkCard className="rounded-3xl mb-6">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.25em] text-moss mb-6">
            What happens next
          </div>
          <div className="space-y-6">
            {NEXT_STEPS.map((step) => (
              <div key={step.n} className="flex gap-4">
                <div className="font-mono-label text-[11px] text-clay flex-none mt-0.5">{step.n}</div>
                <div>
                  <div className="font-body text-sm text-cream/90 font-medium mb-1">{step.title}</div>
                  <p className="font-body text-xs text-cream/55 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
          </DarkCard>
        </MotionDiv>

        <MotionDiv delay={0.14}>
          <PremiumCard className="bg-white border border-charcoal/10">
          <p className="font-body text-sm text-charcoal/60 mb-5">
            Questions before your first class? We're happy to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <ClayButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/programs">Explore Programs</Link>
            </ClayButton>
            <OutlineButton asChild className="px-7 py-3.5 text-[11px] uppercase tracking-[0.18em]">
              <Link href="/contact">Contact Us</Link>
            </OutlineButton>
          </div>
          </PremiumCard>
        </MotionDiv>
      </main>
    </MotionPage>
  );
}
