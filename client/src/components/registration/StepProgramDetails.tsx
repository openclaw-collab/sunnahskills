import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, CheckboxGroup, SelectField } from "./FormControls";
import type { RegistrationStepProps } from "@/components/registration/steps";
import type { BjjSpecific, ArcherySpecific, OutdoorSpecific, BullyproofingSpecific } from "@/hooks/useRegistration";

const WORKSHOP_DATES = [
  { value: "2026-04-12", label: "April 12, 2026 — Morning session" },
  { value: "2026-04-26", label: "April 26, 2026 — Morning session" },
  { value: "2026-05-10", label: "May 10, 2026 — Morning session" },
  { value: "2026-05-24", label: "May 24, 2026 — Morning session" },
];

const ARCHERY_SESSIONS = [
  { value: "summer-2026-a", label: "Summer 2026 — Session A (Jul 7 – Jul 25)" },
  { value: "summer-2026-b", label: "Summer 2026 — Session B (Aug 4 – Aug 22)" },
  { value: "fall-2026", label: "Fall 2026 — Session (Sep 8 – Oct 17)" },
];

const GEAR_OPTIONS = [
  { value: "boots", label: "Sturdy, closed-toe boots" },
  { value: "rain-gear", label: "Rain gear / waterproof layer" },
  { value: "water-bottle", label: "Water bottle (1L+)" },
  { value: "sun-protection", label: "Sun protection (hat + sunscreen)" },
];

function BjjFields({ draft, updateDraft }: RegistrationStepProps) {
  const ps = draft.programDetails.programSpecific as BjjSpecific;
  const set = (patch: Partial<BjjSpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as BjjSpecific,
      },
    }));

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Class group"
        name="bjj-gender"
        value={ps.gender}
        onChange={(v) => set({ gender: v as BjjSpecific["gender"] })}
        options={[
          { value: "boys", label: "Boys' class" },
          { value: "girls", label: "Girls' class" },
        ]}
      />
      <RadioGroup
        label="Age group"
        name="bjj-age"
        value={ps.ageGroup}
        onChange={(v) => set({ ageGroup: v as BjjSpecific["ageGroup"] })}
        options={[
          { value: "6-10", label: "6–10 yrs", sublabel: "Fundamentals" },
          { value: "11-14", label: "11–14 yrs", sublabel: "Intermediate" },
          { value: "15-17", label: "15–17 yrs", sublabel: "Advanced" },
        ]}
      />
      <RadioGroup
        label="Would you like to start with a trial class?"
        name="bjj-trial"
        value={ps.trialClass}
        onChange={(v) => set({ trialClass: v as BjjSpecific["trialClass"] })}
        options={[
          { value: "yes", label: "Yes, trial class first" },
          { value: "no", label: "No, enrol directly" },
        ]}
      />
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Goals, concerns, or questions for the coach"
          rows={3}
        />
      </div>
    </div>
  );
}

function ArcheryFields({ draft, updateDraft }: RegistrationStepProps) {
  const ps = draft.programDetails.programSpecific as ArcherySpecific;
  const set = (patch: Partial<ArcherySpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as ArcherySpecific,
      },
    }));

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Dominant hand"
        name="archery-hand"
        value={ps.dominantHand}
        onChange={(v) => set({ dominantHand: v as ArcherySpecific["dominantHand"] })}
        options={[
          { value: "right", label: "Right-handed" },
          { value: "left", label: "Left-handed" },
        ]}
      />
      <RadioGroup
        label="Prior archery experience"
        name="archery-exp"
        value={ps.experience}
        onChange={(v) => set({ experience: v as ArcherySpecific["experience"] })}
        options={[
          { value: "never", label: "Never tried", sublabel: "Complete beginner" },
          { value: "some", label: "Some experience", sublabel: "A few sessions" },
          { value: "practiced", label: "Practiced before", sublabel: "Regular practice" },
        ]}
      />
      <SelectField
        label="Preferred session"
        value={ps.sessionDate}
        onChange={(v) => set({ sessionDate: v })}
        options={ARCHERY_SESSIONS}
        placeholder="Select a session"
      />
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Equipment questions, goals, or accessibility needs"
          rows={3}
        />
      </div>
    </div>
  );
}

function OutdoorFields({ draft, updateDraft }: RegistrationStepProps) {
  const ps = draft.programDetails.programSpecific as OutdoorSpecific;
  const set = (patch: Partial<OutdoorSpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as OutdoorSpecific,
      },
    }));

  return (
    <div className="space-y-6">
      <SelectField
        label="Workshop date"
        value={ps.workshopDate}
        onChange={(v) => set({ workshopDate: v })}
        options={WORKSHOP_DATES}
        placeholder="Select a date"
      />
      <CheckboxGroup
        label="Gear checklist — please confirm you'll bring:"
        options={GEAR_OPTIONS}
        values={ps.gear}
        onChange={(v) => set({ gear: v })}
      />
      <div className="rounded-xl border border-charcoal/10 bg-moss/5 px-4 py-3">
        <p className="font-body text-xs text-charcoal/60 leading-relaxed">
          All four items are required for participation. Students without proper gear may not be able to join the full session.
        </p>
      </div>
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Workshop goals, outdoor comfort level, or questions"
          rows={3}
        />
      </div>
    </div>
  );
}

function BullyproofingFields({ draft, updateDraft }: RegistrationStepProps) {
  const ps = draft.programDetails.programSpecific as BullyproofingSpecific;
  const set = (patch: Partial<BullyproofingSpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as BullyproofingSpecific,
      },
    }));

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Primary concern"
        name="bp-concern"
        value={ps.concernType}
        onChange={(v) => set({ concernType: v as BullyproofingSpecific["concernType"] })}
        options={[
          { value: "being-bullied", label: "Being bullied", sublabel: "Needs assertiveness + tools" },
          { value: "exhibiting", label: "Exhibiting bullying behaviour", sublabel: "Learning empathy + boundaries" },
          { value: "confidence", label: "General confidence building", sublabel: "Proactive development" },
        ]}
      />
      <RadioGroup
        label="Student age group"
        name="bp-age"
        value={ps.ageGroup}
        onChange={(v) => set({ ageGroup: v as BullyproofingSpecific["ageGroup"] })}
        options={[
          { value: "6-9", label: "6–9 yrs" },
          { value: "10-13", label: "10–13 yrs" },
          { value: "14+", label: "14+ yrs" },
        ]}
      />
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Context, specific situations, or what you want your child to learn"
          rows={3}
        />
      </div>
    </div>
  );
}

export function StepProgramDetails(props: RegistrationStepProps) {
  const { draft, updateDraft } = props;
  const slug = draft.programSlug;

  return (
    <div className="space-y-8">
      {slug === "bjj" && <BjjFields {...props} />}
      {slug === "archery" && <ArcheryFields {...props} />}
      {slug === "outdoor" && <OutdoorFields {...props} />}
      {slug === "bullyproofing" && <BullyproofingFields {...props} />}

      {/* Sibling discount — shown for all programs */}
      <div className="border-t border-charcoal/10 pt-6">
        <RadioGroup
          label="Registering siblings at the same time?"
          name="sibling-count"
          value={String(draft.programDetails.siblingCount)}
          onChange={(v) =>
            updateDraft((prev) => ({
              ...prev,
              programDetails: {
                ...prev.programDetails,
                siblingCount: Number(v) as 0 | 1 | 2,
              },
            }))
          }
          options={[
            { value: "0", label: "No siblings", sublabel: "No discount" },
            { value: "1", label: "1 sibling", sublabel: "−10% on all fees" },
            { value: "2", label: "2+ siblings", sublabel: "−10% on all fees" },
          ]}
        />
        {draft.programDetails.siblingCount > 0 && (
          <p className="mt-2 font-body text-xs text-moss">
            A 10% sibling discount will be applied at checkout.
          </p>
        )}
      </div>
    </div>
  );
}
