import { useCallback, useState } from "react";
import type { RegistrationDraft } from "./useRegistration";
import {
  archeryDominantHandOptions,
  archeryExperienceOptions,
  archerySessionOptions,
  bjjTrackOptions,
  bjjTrialClassOptions,
  bullyproofingAgeGroupOptions,
  bullyproofingConcernOptions,
  guardianRelationshipOptions,
  outdoorGearOptions,
  outdoorWorkshopDateOptions,
  studentGenderOptions,
  studentSkillLevelOptions,
} from "@shared/registration-options";

export type ValidationErrors = Record<string, string>;

type ValidatorFn = (draft: RegistrationDraft) => ValidationErrors;

const guardianValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  if (draft.guardian.fullName.trim().length < 2) errors["guardian.fullName"] = "Full name is required";
  if (!draft.guardian.email.trim()) {
    errors["guardian.email"] = "Email is required";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.guardian.email.trim())) {
    errors["guardian.email"] = "Enter a valid email address";
  }
  if (!draft.guardian.phone.trim()) {
    errors["guardian.phone"] = "Phone number is required";
  } else if (draft.guardian.phone.replace(/[^\d]/g, "").length < 10) {
    errors["guardian.phone"] = "Enter a valid phone number";
  }
  if (!draft.guardian.relationship) {
    errors["guardian.relationship"] = "Please select your relationship to the student";
  } else if (!guardianRelationshipOptions.some((opt) => opt.value === draft.guardian.relationship)) {
    errors["guardian.relationship"] = "Please select a valid relationship";
  }
  return errors;
};

const studentValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  if (draft.student.fullName.trim().length < 2) errors["student.fullName"] = "Student full name is required";
  if (!draft.student.dateOfBirth) {
    errors["student.dateOfBirth"] = "Date of birth is required";
  } else {
    const dob = Date.parse(draft.student.dateOfBirth);
    if (!Number.isFinite(dob) || dob > Date.now()) {
      errors["student.dateOfBirth"] = "Enter a valid past date";
    }
  }
  if (draft.student.gender && !studentGenderOptions.some((opt) => opt.value === draft.student.gender)) {
    errors["student.gender"] = "Select a valid gender option";
  }
  if (draft.student.skillLevel && !studentSkillLevelOptions.some((opt) => opt.value === draft.student.skillLevel)) {
    errors["student.skillLevel"] = "Select a valid experience level";
  }
  return errors;
};

const detailsValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  const ps = draft.programDetails.programSpecific as any;
  if (draft.programSlug === "bjj") {
    if (!ps.bjjTrack) errors["programSpecific.bjjTrack"] = "Please select a class track";
    if (ps.bjjTrack && !bjjTrackOptions.some((opt) => opt.value === ps.bjjTrack)) {
      errors["programSpecific.bjjTrack"] = "Please select a valid class track";
    }
    if (!ps.trialClass) errors["programSpecific.trialClass"] = "Please choose a trial class option";
    if (ps.trialClass && !bjjTrialClassOptions.some((opt) => opt.value === ps.trialClass)) {
      errors["programSpecific.trialClass"] = "Please select a valid trial option";
    }
    if (!draft.programDetails.sessionId) errors["programDetails.sessionId"] = "Please select a class session";
    if (!draft.programDetails.priceId) errors["programDetails.priceId"] = "Pricing is missing — pick a track again";
  }
  if (draft.programSlug === "archery") {
    if (!ps.dominantHand) errors["programSpecific.dominantHand"] = "Please select your dominant hand";
    if (ps.dominantHand && !archeryDominantHandOptions.some((opt) => opt.value === ps.dominantHand)) {
      errors["programSpecific.dominantHand"] = "Please select a valid dominant hand";
    }
    if (!ps.experience) errors["programSpecific.experience"] = "Please select your experience level";
    if (ps.experience && !archeryExperienceOptions.some((opt) => opt.value === ps.experience)) {
      errors["programSpecific.experience"] = "Please select a valid experience level";
    }
    if (!ps.sessionDate) errors["programSpecific.sessionDate"] = "Please select a session";
    if (ps.sessionDate && !archerySessionOptions.some((opt) => opt.value === ps.sessionDate)) {
      errors["programSpecific.sessionDate"] = "Please select a valid session";
    }
  }
  if (draft.programSlug === "outdoor") {
    if (!ps.workshopDate) errors["programSpecific.workshopDate"] = "Please select a workshop date";
    if (ps.workshopDate && !outdoorWorkshopDateOptions.some((opt) => opt.value === ps.workshopDate)) {
      errors["programSpecific.workshopDate"] = "Please select a valid workshop date";
    }
    if (!ps.gear || ps.gear.length === 0) errors["programSpecific.gear"] = "Please confirm you have the required gear";
    if (ps.gear.some((item: string) => !outdoorGearOptions.some((opt) => opt.value === item))) {
      errors["programSpecific.gear"] = "Please confirm valid gear selections";
    }
  }
  if (draft.programSlug === "bullyproofing") {
    if (!ps.concernType) errors["programSpecific.concernType"] = "Please select the primary concern";
    if (ps.concernType && !bullyproofingConcernOptions.some((opt) => opt.value === ps.concernType)) {
      errors["programSpecific.concernType"] = "Please select a valid concern";
    }
    if (!ps.ageGroup) errors["programSpecific.ageGroup"] = "Please select an age group";
    if (ps.ageGroup && !bullyproofingAgeGroupOptions.some((opt) => opt.value === ps.ageGroup)) {
      errors["programSpecific.ageGroup"] = "Please select a valid age group";
    }
  }
  return errors;
};

const waiversValidator: ValidatorFn = (draft) => {
  const errors: ValidationErrors = {};
  const selectedBjjTrack = draft.programSlug === "bjj"
    ? String((draft.programDetails.programSpecific as { bjjTrack?: string })?.bjjTrack ?? "")
    : "";
  const requiresPhotoConsent = !(draft.programSlug === "bjj" && selectedBjjTrack.startsWith("women-11-"));
  if (!draft.waivers.liabilityWaiver) errors["waivers.liabilityWaiver"] = "Please agree to the liability waiver";
  if (requiresPhotoConsent && !draft.waivers.photoConsent) {
    errors["waivers.photoConsent"] = "Please agree to the media waiver";
  }
  if (!draft.waivers.medicalConsent) errors["waivers.medicalConsent"] = "Please consent to medical treatment authorization";
  if (!draft.waivers.termsAgreement) errors["waivers.termsAgreement"] = "Please agree to the terms and policies";
  if (!draft.waivers.signatureText.trim()) errors["waivers.signatureText"] = "Please type your full name as a signature";
  if (!draft.waivers.signedAt) {
    errors["waivers.signedAt"] = "Please add today’s date";
  } else {
    const signedAt = Date.parse(draft.waivers.signedAt);
    if (!Number.isFinite(signedAt) || signedAt > Date.now()) {
      errors["waivers.signedAt"] = "Enter a valid past date";
    }
  }
  return errors;
};

const VALIDATORS: Record<string, ValidatorFn> = {
  guardian: guardianValidator,
  student: studentValidator,
  details: detailsValidator,
  waivers: waiversValidator,
};

/** Returns first blocking message for guardian + student + program details (e.g. before “Add to cart”). */
export function blockingMessageThroughDetails(draft: RegistrationDraft): string | null {
  const errors = {
    ...guardianValidator(draft),
    ...studentValidator(draft),
    ...detailsValidator(draft),
  };
  const k = Object.keys(errors)[0];
  return k ? errors[k]! : null;
}

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
