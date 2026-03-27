import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "./FormControls";
import type { RegistrationStepProps } from "@/components/registration/steps";
import type { ValidationErrors } from "@/hooks/useStepValidation";
import { guardianRelationshipOptions } from "@shared/registration-options";
import { StudioBlock } from "@/studio/StudioBlock";

type Props = RegistrationStepProps & {
  errors?: ValidationErrors;
  touch?: (field: string) => void;
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="font-body text-xs text-clay mt-1">{msg}</p>;
}

function FormInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="font-body text-sm text-charcoal font-medium">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          onChange(value.trim());
          onBlur?.();
        }}
        placeholder={placeholder}
        type={type}
        className={error ? "border-clay focus:border-clay ring-clay/20" : ""}
      />
      <FieldError msg={error} />
    </div>
  );
}

function sanitizePhone(value: string) {
  return value.replace(/[^\d+()\-\s]/g, "").replace(/\s+/g, " ").trim();
}

export function StepGuardianInfo({ draft, updateDraft, errors = {}, touch }: Props) {
  const set = (patch: Partial<typeof draft.guardian>) =>
    updateDraft((prev) => ({ ...prev, guardian: { ...prev.guardian, ...patch } }));

  return (
    <StudioBlock id={`registration.${draft.programSlug}.guardian-step`} label="Guardian info step">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          id="guardian-name"
          label="Full name"
          value={draft.guardian.fullName}
          onChange={(v) => set({ fullName: v })}
          onBlur={() => touch?.("guardian.fullName")}
          placeholder="Parent or guardian full name"
          error={errors["guardian.fullName"]}
        />
        <FormInput
          id="guardian-email"
          label="Email"
          value={draft.guardian.email}
          onChange={(v) => set({ email: v })}
          onBlur={() => {
            set({ email: draft.guardian.email.trim().toLowerCase() });
            touch?.("guardian.email");
          }}
          placeholder="name@email.com"
          type="email"
          error={errors["guardian.email"]}
        />
        <FormInput
          id="guardian-phone"
          label="Phone"
          value={draft.guardian.phone}
          onChange={(v) => set({ phone: v })}
          onBlur={() => {
            set({ phone: sanitizePhone(draft.guardian.phone) });
            touch?.("guardian.phone");
          }}
          placeholder="(555) 555-5555"
          type="tel"
          error={errors["guardian.phone"]}
        />

        <SelectField
          label="Relationship to student"
          value={draft.guardian.relationship}
          onChange={(v) => set({ relationship: v })}
          onBlur={() => touch?.("guardian.relationship")}
          options={[...guardianRelationshipOptions]}
          placeholder="Select relationship"
          error={errors["guardian.relationship"]}
        />

        <FormInput
          id="guardian-emergency-name"
          label="Emergency contact name"
          value={draft.guardian.emergencyContactName}
          onChange={(v) => set({ emergencyContactName: v })}
          placeholder="Emergency contact full name"
        />
        <FormInput
          id="guardian-emergency-phone"
          label="Emergency contact phone"
          value={draft.guardian.emergencyContactPhone}
          onChange={(v) => set({ emergencyContactPhone: v })}
          onBlur={() => set({ emergencyContactPhone: sanitizePhone(draft.guardian.emergencyContactPhone) })}
          placeholder="(555) 555-5555"
          type="tel"
        />

        <div className="md:col-span-2 rounded-2xl border border-charcoal/10 bg-cream p-4">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-1">
            Notes (optional)
          </div>
          <p className="text-xs text-charcoal/60 font-body mb-3">
            Use a real email so we can confirm placement, share schedule updates, and send start details.
          </p>
          <Textarea
            value={draft.guardian.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            onBlur={() => set({ notes: (draft.guardian.notes ?? "").trim() })}
            placeholder="Anything we should know before placement?"
            rows={3}
          />
        </div>
      </div>
    </StudioBlock>
  );
}
