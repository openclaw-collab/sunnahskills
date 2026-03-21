import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, CheckboxGroup, SelectField } from "./FormControls";
import type { RegistrationStepProps } from "@/components/registration/steps";
import type { BjjSpecific, ArcherySpecific, OutdoorSpecific, BullyproofingSpecific } from "@/hooks/useRegistration";
import {
  archeryDominantHandOptions,
  archeryExperienceOptions,
  archerySessionOptions,
  bjjAgeGroupOptions,
  bjjClassGroupOptions,
  bjjTrialClassOptions,
  bullyproofingAgeGroupOptions,
  bullyproofingConcernOptions,
  outdoorGearOptions,
  outdoorWorkshopDateOptions,
} from "@shared/registration-options";

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
        options={[...bjjClassGroupOptions]}
      />
      <RadioGroup
        label="Age group"
        name="bjj-age"
        value={ps.ageGroup}
        onChange={(v) => set({ ageGroup: v as BjjSpecific["ageGroup"] })}
        options={bjjAgeGroupOptions.map((opt) => ({
          ...opt,
          sublabel:
            opt.value === "6-10" ? "Fundamentals" : opt.value === "11-14" ? "Intermediate" : "Advanced",
        }))}
      />
      <RadioGroup
        label="Would you like to start with a trial class?"
        name="bjj-trial"
        value={ps.trialClass}
        onChange={(v) => set({ trialClass: v as BjjSpecific["trialClass"] })}
        options={[...bjjTrialClassOptions]}
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
        options={[...archeryDominantHandOptions]}
      />
      <RadioGroup
        label="Prior archery experience"
        name="archery-exp"
        value={ps.experience}
        onChange={(v) => set({ experience: v as ArcherySpecific["experience"] })}
        options={archeryExperienceOptions.map((opt) => ({
          ...opt,
          sublabel:
            opt.value === "never" ? "Complete beginner" : opt.value === "some" ? "A few sessions" : "Regular practice",
        }))}
      />
      <SelectField
        label="Preferred session"
        value={ps.sessionDate}
        onChange={(v) => set({ sessionDate: v })}
        options={[...archerySessionOptions]}
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
        options={[...outdoorWorkshopDateOptions]}
        placeholder="Select a date"
      />
      <CheckboxGroup
        label="Gear checklist — please confirm you'll bring:"
        options={[...outdoorGearOptions]}
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
        options={bullyproofingConcernOptions.map((opt) => ({
          ...opt,
          sublabel:
            opt.value === "being-bullied"
              ? "Needs assertiveness + tools"
              : opt.value === "exhibiting"
                ? "Learning empathy + boundaries"
                : "Proactive development",
        }))}
      />
      <RadioGroup
        label="Student age group"
        name="bp-age"
        value={ps.ageGroup}
        onChange={(v) => set({ ageGroup: v as BullyproofingSpecific["ageGroup"] })}
        options={[...bullyproofingAgeGroupOptions]}
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
