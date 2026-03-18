import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RegistrationStepProps } from "@/components/registration/steps";
import type { ProgramSlug } from "@/lib/programConfig";

function programDetailsHint(slug: ProgramSlug) {
  if (slug === "bjj") return "Optional: trial class preference, class grouping notes, or goals.";
  if (slug === "archery") return "Optional: experience level, dominant hand, any equipment questions.";
  if (slug === "outdoor") return "Optional: workshop goals, gear questions, and comfort level outdoors.";
  return "Optional: parent concerns, context, and what you want your child to learn.";
}

export function StepProgramDetails({ draft, updateDraft }: RegistrationStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Preferred start date</label>
        <Input
          value={draft.programDetails.preferredStartDate}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              programDetails: { ...prev.programDetails, preferredStartDate: e.target.value },
            }))
          }
          placeholder="YYYY-MM-DD (optional)"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Schedule preference</label>
        <Input
          value={draft.programDetails.scheduleChoice}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              programDetails: { ...prev.programDetails, scheduleChoice: e.target.value },
            }))
          }
          placeholder="Optional (e.g., mornings, weekdays)"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Session ID (temporary)</label>
        <Input
          value={draft.programDetails.sessionId ?? ""}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              programDetails: {
                ...prev.programDetails,
                sessionId: e.target.value ? Number(e.target.value) : null,
              },
            }))
          }
          placeholder="Will be replaced by session picker"
          inputMode="numeric"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Price tier ID (temporary)</label>
        <Input
          value={draft.programDetails.priceId ?? ""}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              programDetails: {
                ...prev.programDetails,
                priceId: e.target.value ? Number(e.target.value) : null,
              },
            }))
          }
          placeholder="Will be replaced by pricing selector"
          inputMode="numeric"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="font-body text-sm text-charcoal">Notes (optional)</label>
        <Textarea
          value={typeof draft.programDetails.programSpecific.notes === "string" ? draft.programDetails.programSpecific.notes : ""}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              programDetails: {
                ...prev.programDetails,
                programSpecific: { ...prev.programDetails.programSpecific, notes: e.target.value },
              },
            }))
          }
          placeholder={programDetailsHint(draft.programSlug)}
          rows={4}
        />
      </div>
    </div>
  );
}

