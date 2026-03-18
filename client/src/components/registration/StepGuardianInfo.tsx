import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RegistrationStepProps } from "@/components/registration/steps";

export function StepGuardianInfo({ draft, updateDraft }: RegistrationStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="guardian-full-name" className="font-body text-sm text-charcoal">
          Full name
        </label>
        <Input
          id="guardian-full-name"
          value={draft.guardian.fullName}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              guardian: { ...prev.guardian, fullName: e.target.value },
            }))
          }
          placeholder="Parent/guardian full name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guardian-email" className="font-body text-sm text-charcoal">
          Email
        </label>
        <Input
          id="guardian-email"
          value={draft.guardian.email}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              guardian: { ...prev.guardian, email: e.target.value },
            }))
          }
          placeholder="name@email.com"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guardian-phone" className="font-body text-sm text-charcoal">
          Phone
        </label>
        <Input
          id="guardian-phone"
          value={draft.guardian.phone}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              guardian: { ...prev.guardian, phone: e.target.value },
            }))
          }
          placeholder="(555) 555-5555"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guardian-relationship" className="font-body text-sm text-charcoal">
          Relationship to student
        </label>
        <Input
          id="guardian-relationship"
          value={draft.guardian.relationship}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              guardian: { ...prev.guardian, relationship: e.target.value },
            }))
          }
          placeholder="Mother / Father / Guardian / Other"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guardian-emergency-name" className="font-body text-sm text-charcoal">
          Emergency contact name
        </label>
        <Input
          id="guardian-emergency-name"
          value={draft.guardian.emergencyContactName}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              guardian: { ...prev.guardian, emergencyContactName: e.target.value },
            }))
          }
          placeholder="Emergency contact full name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guardian-emergency-phone" className="font-body text-sm text-charcoal">
          Emergency contact phone
        </label>
        <Input
          id="guardian-emergency-phone"
          value={draft.guardian.emergencyContactPhone}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              guardian: { ...prev.guardian, emergencyContactPhone: e.target.value },
            }))
          }
          placeholder="(555) 555-5555"
        />
      </div>

      <div className="md:col-span-2 rounded-2xl border border-charcoal/10 bg-cream p-4">
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
          Notes
        </div>
        <p className="mt-2 text-sm text-charcoal/70 font-body">
          Use a real email and phone so we can confirm placement, send start details, and share schedule updates.
        </p>
        <Textarea
          id="guardian-notes"
          className="mt-3"
          value={draft.guardian.notes ?? ""}
          onChange={(e) =>
            updateDraft((prev) => ({
              ...prev,
              guardian: { ...prev.guardian, notes: e.target.value },
            }))
          }
          placeholder="Optional: anything we should know before placement?"
          rows={3}
        />
      </div>
    </div>
  );
}

