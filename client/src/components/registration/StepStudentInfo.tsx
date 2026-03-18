import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RegistrationStepProps } from "@/components/registration/steps";

export function StepStudentInfo({ draft, updateDraft }: RegistrationStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Student full name</label>
        <Input
          value={draft.student.fullName}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              student: { ...prev.student, fullName: e.target.value },
            }))
          }
          placeholder="Student full name"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Preferred name (optional)</label>
        <Input
          value={draft.student.preferredName}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              student: { ...prev.student, preferredName: e.target.value },
            }))
          }
          placeholder="What should we call them?"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Date of birth</label>
        <Input
          value={draft.student.dateOfBirth}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              student: { ...prev.student, dateOfBirth: e.target.value },
            }))
          }
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Age</label>
        <Input
          value={draft.student.age ?? ""}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              student: { ...prev.student, age: e.target.value ? Number(e.target.value) : null },
            }))
          }
          placeholder="Age"
          inputMode="numeric"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Gender (if relevant)</label>
        <Input
          value={draft.student.gender}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              student: { ...prev.student, gender: e.target.value },
            }))
          }
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal">Prior experience (optional)</label>
        <Input
          value={draft.student.priorExperience}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              student: { ...prev.student, priorExperience: e.target.value },
            }))
          }
          placeholder="None / Some / Sports background"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="font-body text-sm text-charcoal">
          Medical notes / allergies / accessibility needs (optional)
        </label>
        <Textarea
          value={draft.student.medicalNotes}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              student: { ...prev.student, medicalNotes: e.target.value },
            }))
          }
          placeholder="Anything we should know to support the student safely?"
          rows={4}
        />
      </div>
    </div>
  );
}

