import { useCallback, useState } from "react";
import type { RegistrationDraft } from "./useRegistration";

export type ValidationErrors = Record<string, string>;

type ValidatorFn = (draft: RegistrationDraft) => ValidationErrors;

const guardianValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  if (!draft.guardian.fullName.trim()) errors["guardian.fullName"] = "Full name is required";
  if (!draft.guardian.email.trim()) {
    errors["guardian.email"] = "Email is required";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.guardian.email)) {
    errors["guardian.email"] = "Enter a valid email address";
  }
  if (!draft.guardian.phone.trim()) errors["guardian.phone"] = "Phone number is required";
  if (!draft.guardian.relationship) errors["guardian.relationship"] = "Please select your relationship to the student";
  return errors;
};

const studentValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  if (!draft.student.fullName.trim()) errors["student.fullName"] = "Student full name is required";
  if (!draft.student.dateOfBirth) errors["student.dateOfBirth"] = "Date of birth is required";
  return errors;
};

const detailsValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  const ps = draft.programDetails.programSpecific as any;
  if (draft.programSlug === "bjj") {
    if (!ps.gender) errors["programSpecific.gender"] = "Please select a class group";
    if (!ps.ageGroup) errors["programSpecific.ageGroup"] = "Please select an age group";
  }
  if (draft.programSlug === "archery") {
    if (!ps.dominantHand) errors["programSpecific.dominantHand"] = "Please select your dominant hand";
    if (!ps.sessionDate) errors["programSpecific.sessionDate"] = "Please select a session";
  }
  if (draft.programSlug === "outdoor") {
    if (!ps.workshopDate) errors["programSpecific.workshopDate"] = "Please select a workshop date";
    if (!ps.gear || ps.gear.length === 0) errors["programSpecific.gear"] = "Please confirm you have the required gear";
  }
  if (draft.programSlug === "bullyproofing") {
    if (!ps.concernType) errors["programSpecific.concernType"] = "Please select the primary concern";
    if (!ps.ageGroup) errors["programSpecific.ageGroup"] = "Please select an age group";
  }
  return errors;
};

const waiversValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  if (!draft.waivers.liabilityWaiver) errors["waivers.liabilityWaiver"] = "Please agree to the liability waiver";
  if (!draft.waivers.medicalConsent) errors["waivers.medicalConsent"] = "Please consent to medical treatment authorization";
  if (!draft.waivers.termsAgreement) errors["waivers.termsAgreement"] = "Please agree to the terms and policies";
  if (!draft.waivers.signatureText.trim()) errors["waivers.signatureText"] = "Please type your full name as a signature";
  return errors;
};

const VALIDATORS: Record<string, ValidatorFn> = {
  guardian: guardianValidator,
  student: studentValidator,
  details: detailsValidator,
  waivers: waiversValidator,
};

export function useStepValidation(stepId: string, draft: RegistrationDraft) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validator = VALIDATORS[stepId];
  const allErrors: ValidationErrors = validator ? validator(draft) : {};

  const errors: ValidationErrors = {};
  for (const key of Object.keys(allErrors)) {
    if (touched[key]) errors[key] = allErrors[key];
  }

  const touch = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const touchAll = useCallback(() => {
    if (!validator) return;
    // Compute errors fresh (not from stale closure) and touch all error keys
    const freshErrors = validator(draft);
    const allTouched: Record<string, boolean> = {};
    for (const k of Object.keys(freshErrors)) allTouched[k] = true;
    setTouched((prev) => ({ ...prev, ...allTouched }));
  }, [validator, draft]);

  const isValid = Object.keys(allErrors).length === 0;

  const validateAndTouch = useCallback((): boolean => {
    touchAll();
    return isValid;
  }, [touchAll, isValid]);

  return { errors, touch, isValid, validateAndTouch };
}
