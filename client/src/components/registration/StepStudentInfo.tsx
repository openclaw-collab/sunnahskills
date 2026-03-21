import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup } from "./FormControls";
import type { RegistrationStepProps } from "@/components/registration/steps";
import type { ValidationErrors } from "@/hooks/useStepValidation";
import { studentGenderOptions, studentSkillLevelOptions } from "@shared/registration-options";

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
  inputMode,
}: {
  id?: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  onBlur?: () => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
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
          if (typeof value === "string") onChange(value.trim());
          onBlur?.();
        }}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        className={error ? "border-clay focus:border-clay" : ""}
      />
      <FieldError msg={error} />
    </div>
  );
}

export function StepStudentInfo({ draft, updateDraft, errors = {}, touch }: Props) {
  const set = (patch: Partial<typeof draft.student>) =>
    updateDraft((prev) => ({ ...prev, student: { ...prev.student, ...patch } }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          id="student-name"
          label="Student full name"
          value={draft.student.fullName}
          onChange={(v) => set({ fullName: v })}
          onBlur={() => touch?.("student.fullName")}
          placeholder="Student's full name"
          error={errors["student.fullName"]}
        />
        <FormInput
          id="student-preferred"
          label="Preferred name (optional)"
          value={draft.student.preferredName}
          onChange={(v) => set({ preferredName: v })}
          placeholder="What should we call them?"
        />
        <FormInput
          id="student-dob"
        label="Date of birth"
        value={draft.student.dateOfBirth}
        onChange={(v) => {
          set({ dateOfBirth: v, age: v ? Math.floor((Date.now() - new Date(v).getTime()) / 31557600000) : null });
        }}
          onBlur={() => touch?.("student.dateOfBirth")}
          placeholder="YYYY-MM-DD"
          type="date"
          error={errors["student.dateOfBirth"]}
        />
        <div className="space-y-2">
          <label className="font-body text-sm text-charcoal font-medium">Age</label>
          <Input
            value={draft.student.age ?? ""}
            readOnly
            className="bg-cream/60 text-charcoal/60"
            placeholder="Calculated from date of birth"
          />
        </div>
      </div>

      <RadioGroup
        label="Gender"
        name="student-gender"
        value={draft.student.gender}
        onChange={(v) => set({ gender: v })}
        options={[...studentGenderOptions]}
      />

      <RadioGroup
        label="Prior experience level"
        name="student-skill"
        value={draft.student.skillLevel}
        onChange={(v) => set({ skillLevel: v })}
        options={studentSkillLevelOptions.map((opt) => ({
          ...opt,
          sublabel:
            opt.value === "beginner"
              ? "No prior training"
              : opt.value === "some"
                ? "A few sessions"
                : "6+ months training",
        }))}
      />

      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">
          Medical notes, allergies, or accessibility needs (optional)
        </label>
        <Textarea
          value={draft.student.medicalNotes}
          onChange={(e) => set({ medicalNotes: e.target.value })}
          onBlur={() => set({ medicalNotes: draft.student.medicalNotes.trim() })}
          placeholder="Anything we should know to support the student safely?"
          rows={3}
        />
      </div>
    </div>
  );
}
