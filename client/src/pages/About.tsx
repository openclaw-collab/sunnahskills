import React from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { DarkCard } from "@/components/brand/DarkCard";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

export default function About() {
  return (
    <div className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-32">
        <StudioBlock id="about.header" label="Header" page="About">
          <SectionHeader
            eyebrow={<StudioText k="about.eyebrow" defaultText="About" as="span" className="inline" />}
            title={<StudioText k="about.title" defaultText="The Sunnah Skills Philosophy" as="span" className="inline" />}
            className="mb-10"
          />
        </StudioBlock>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PremiumCard className="bg-white border border-charcoal/10">
            <p className="font-body text-sm text-charcoal/75 leading-relaxed">
              <StudioText
                k="about.ledeA"
                defaultText="Most youth programs keep children busy. Sunnah Skills is structured to build discipline, restraint, composure, and confidence through technical training in Brazilian Jiu-Jitsu, archery, and outdoor workshops."
                as="span"
                className="inline"
                multiline
              />
            </p>
            <p className="font-body text-sm text-charcoal/75 leading-relaxed mt-4">
              <StudioText
                k="about.ledeB"
                defaultText="We focus on long-term character formation: clear standards, consistent coaching, and parent-aligned development."
                as="span"
                className="inline"
                multiline
              />
            </p>
          </PremiumCard>

          <DarkCard>
            <div className="font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em] mb-4">
              Training values
            </div>
            <ul className="text-cream/80 text-sm space-y-2">
              <li>+ Adab before achievement</li>
              <li>+ Technique before force</li>
              <li>+ Consistency before intensity</li>
              <li>+ Service, humility, and responsibility</li>
            </ul>
          </DarkCard>
        </div>
      </main>
    </div>
  );
}

