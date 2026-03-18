import React from "react";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { DarkCard } from "@/components/brand/DarkCard";
import { TechniqueViewer } from "@/components/grapplemap/TechniqueViewer";

const TechniqueLibrary = () => {
  return (
    <div className="bg-cream min-h-screen pb-24">
      <main className="max-w-6xl mx-auto px-6 pt-32">
        <SectionHeader
          eyebrow="Technique Library"
          title="GrappleMap Sequences"
          className="mb-10"
        />
        <p className="font-body text-sm text-charcoal/70 max-w-2xl mb-10">
          Explore curated sequences from the training curriculum. This section will grow into a
          full technique browser powered by GrappleMap data.
        </p>

        <DarkCard>
          <div className="mb-4 font-mono-label text-[11px] text-cream/70 uppercase tracking-[0.2em]">
            Featured Sequence
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="relative w-full h-72 md:h-80 rounded-2xl overflow-hidden border border-moss/25">
              <TechniqueViewer className="w-full h-full" />
            </div>
            <div className="space-y-3 text-sm font-body text-cream/80">
              <p className="text-xs uppercase tracking-[0.2em] text-clay">
                Uchi-mata → Armbar → Tap
              </p>
              <p>
                A classic throw-to-submission chain used to teach off-balancing, commitment, and
                clean finishing mechanics. Students learn to connect stand-up entries to safe
                ground control and a decisive tap.
              </p>
              <ul className="text-xs space-y-1.5 text-cream/70">
                <li>+ Collar tie to weak underhook</li>
                <li>+ Uchi-mata entry and finish</li>
                <li>+ Transition to armbar control</li>
                <li>+ Clean, pressure-controlled tap</li>
              </ul>
            </div>
          </div>
        </DarkCard>
      </main>
    </div>
  );
};

export default TechniqueLibrary;

