import { useCallback, useMemo, useState } from "react";
import type { ProgramSlug } from "@/lib/programConfig";

export type BjjTrackValue =
  | "girls-5-10"
  | "boys-7-13"
  | "women-11-tue"
  | "women-11-thu"
  | "men-14"
  | "";

export type BjjSpecific = {
  bjjTrack: BjjTrackValue;
  trialClass: "yes" | "no" | "";
  notes: string;
};

export type ArcherySpecific = {
  dominantHand: "left" | "right" | "";
  experience: "never" | "some" | "practiced" | "";
  sessionDate: string;
  notes: string;
};

export type OutdoorSpecific = {
  workshopDate: string;
  gear: string[];
  notes: string;
};

export type BullyproofingSpecific = {
  concernType: "being-bullied" | "exhibiting" | "confidence" | "";
  ageGroup: "6-9" | "10-13" | "14+" | "";
  notes: string;
};

export type ProgramSpecificData = BjjSpecific | ArcherySpecific | OutdoorSpecific | BullyproofingSpecific;

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
    skillLevel: string;
    medicalNotes: string;
  };
  programDetails: {
    offerId: number | null;
    sessionId: number | null;
    priceId: number | null;
    accessCode: string;
    siblingCount: 0 | 1 | 2;
    /** Pay full tuition today vs split (server uses semester later date). */
    paymentChoice: "full" | "plan";
    /** Optional; cart API accepts for D1 program_specific_json parity. */
    preferredStartDate?: string;
    scheduleChoice?: string;
    programSpecific: ProgramSpecificData;
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

function defaultProgramSpecific(slug: ProgramSlug): ProgramSpecificData {
  if (slug === "bjj") return { bjjTrack: "", trialClass: "", notes: "" };
  if (slug === "archery") return { dominantHand: "", experience: "", sessionDate: "", notes: "" };
  if (slug === "outdoor") return { workshopDate: "", gear: [], notes: "" };
  return { concernType: "", ageGroup: "", notes: "" };
}

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
      skillLevel: "",
      medicalNotes: "",
    },
    programDetails: {
      offerId: null,
      sessionId: null,
      priceId: null,
      accessCode: "",
      siblingCount: 0,
      paymentChoice: "full",
      preferredStartDate: "",
      scheduleChoice: "",
      programSpecific: defaultProgramSpecific(programSlug),
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

const DRAFT_KEY = (slug: ProgramSlug) => `ss-reg-draft-${slug}`;

function loadSavedDraft(slug: ProgramSlug): RegistrationDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(slug));
    if (!raw) return null;
    const saved = JSON.parse(raw) as RegistrationDraft;
    const defaults = createEmptyDraft(slug);
    return {
      ...saved,
      programDetails: {
        ...defaults.programDetails,
        ...saved.programDetails,
        paymentChoice: saved.programDetails?.paymentChoice === "plan" ? "plan" : "full",
      },
    };
  } catch {
    return null;
  }
}

function saveDraft(slug: ProgramSlug, draft: RegistrationDraft) {
  try {
    localStorage.setItem(DRAFT_KEY(slug), JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function clearDraft(slug: ProgramSlug) {
  try {
    localStorage.removeItem(DRAFT_KEY(slug));
  } catch {
    // ignore
  }
}

export function useRegistration(programSlug: ProgramSlug) {
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(() => !!loadSavedDraft(programSlug));
  const [draft, setDraft] = useState<RegistrationDraft>(() => createEmptyDraft(programSlug));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const goNext = useCallback(() => setCurrentStepIndex((s) => Math.min(s + 1, 4)), []);
  const goBack = useCallback(() => setCurrentStepIndex((s) => Math.max(s - 1, 0)), []);
  const goTo = useCallback((idx: number) => setCurrentStepIndex(() => Math.max(0, Math.min(idx, 4))), []);

  const updateDraft = useCallback((updater: (prev: RegistrationDraft) => RegistrationDraft) => {
    setDraft((prev) => {
      const next = updater(prev);
      saveDraft(programSlug, next);
      return next;
    });
  }, [programSlug]);

  const resumeDraft = useCallback(() => {
    const saved = loadSavedDraft(programSlug);
    if (saved) {
      setDraft(saved);
      setHasSavedDraft(false);
    }
  }, [programSlug]);

  const reset = useCallback(() => {
    clearDraft(programSlug);
    setDraft(createEmptyDraft(programSlug));
    setHasSavedDraft(false);
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
    resumeDraft,
    hasSavedDraft,
    steps,
    currentStepIndex,
    goNext,
    goBack,
    goTo,
  };
}
