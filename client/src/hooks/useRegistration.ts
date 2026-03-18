import { useCallback, useMemo, useState } from "react";
import type { ProgramSlug } from "@/lib/programConfig";

export type RegistrationDraft = {
  programSlug: ProgramSlug;
  guardian: {
    fullName: string;
    email: string;
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    relationship: string;
    notes?: string;
  };
  student: {
    fullName: string;
    preferredName: string;
    dateOfBirth: string;
    age: number | null;
    gender: string;
    priorExperience: string;
    skillLevel: string;
    medicalNotes: string;
  };
  programDetails: {
    sessionId: number | null;
    priceId: number | null;
    preferredStartDate: string;
    scheduleChoice: string;
    siblingEnrollment: boolean;
    programSpecific: Record<string, unknown>;
  };
  waivers: {
    liabilityWaiver: boolean;
    photoConsent: boolean;
    medicalConsent: boolean;
    termsAgreement: boolean;
    signatureText: string;
    signedAt: string;
  };
  payment: {
    discountCode: string;
  };
};

function createEmptyDraft(programSlug: ProgramSlug): RegistrationDraft {
  return {
    programSlug,
    guardian: {
      fullName: "",
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      relationship: "",
      notes: "",
    },
    student: {
      fullName: "",
      preferredName: "",
      dateOfBirth: "",
      age: null,
      gender: "",
      priorExperience: "",
      skillLevel: "",
      medicalNotes: "",
    },
    programDetails: {
      sessionId: null,
      priceId: null,
      preferredStartDate: "",
      scheduleChoice: "",
      siblingEnrollment: false,
      programSpecific: {},
    },
    waivers: {
      liabilityWaiver: false,
      photoConsent: false,
      medicalConsent: false,
      termsAgreement: false,
      signatureText: "",
      signedAt: "",
    },
    payment: {
      discountCode: "",
    },
  };
}

export function useRegistration(programSlug: ProgramSlug) {
  const [draft, setDraft] = useState<RegistrationDraft>(() => createEmptyDraft(programSlug));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const goNext = useCallback(() => setCurrentStepIndex((s) => Math.min(s + 1, 4)), []);
  const goBack = useCallback(() => setCurrentStepIndex((s) => Math.max(s - 1, 0)), []);
  const goTo = useCallback((idx: number) => setCurrentStepIndex(() => Math.max(0, Math.min(idx, 4))), []);

  const updateDraft = useCallback((updater: (prev: RegistrationDraft) => RegistrationDraft) => {
    setDraft((prev) => updater(prev));
  }, []);

  const reset = useCallback(() => {
    setDraft(createEmptyDraft(programSlug));
    setCurrentStepIndex(0);
  }, [programSlug]);

  const steps = useMemo(
    () => [
      { id: "guardian", label: "Guardian" },
      { id: "student", label: "Student" },
      { id: "details", label: "Details" },
      { id: "waivers", label: "Waivers" },
      { id: "payment", label: "Payment" },
    ],
    [],
  );

  return {
    draft,
    updateDraft,
    reset,
    steps,
    currentStepIndex,
    goNext,
    goBack,
    goTo,
  };
}

