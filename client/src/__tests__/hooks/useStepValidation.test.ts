import { describe, expect, it } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStepValidation } from "@/hooks/useStepValidation";
import type { RegistrationDraft } from "@/hooks/useRegistration";

const createDraft = (overrides: Partial<RegistrationDraft> = {}): RegistrationDraft => ({
  programSlug: overrides.programSlug ?? "bjj",
  guardian: {
    fullName: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    relationship: "",
    notes: "",
    ...overrides.guardian,
  },
  student: {
    fullName: "",
    preferredName: "",
    dateOfBirth: "",
    age: null,
    gender: "",
    skillLevel: "",
    medicalNotes: "",
    ...overrides.student,
  },
  programDetails: {
    sessionId: null,
    priceId: null,
    siblingCount: 0,
    programSpecific: { gender: "", ageGroup: "", trialClass: "", notes: "" },
    ...(overrides.programDetails ? {
      ...overrides.programDetails,
      programSpecific: {
        ...overrides.programDetails.programSpecific,
      },
    } : {}),
  },
  waivers: {
    liabilityWaiver: false,
    photoConsent: false,
    medicalConsent: false,
    termsAgreement: false,
    signatureText: "",
    signedAt: "",
    ...overrides.waivers,
  },
  payment: {
    discountCode: "",
    ...overrides.payment,
  },
});

describe("useStepValidation", () => {
  describe("guardian step", () => {
    it("returns errors for empty guardian fields", () => {
      const draft = createDraft();
      const { result } = renderHook(() => useStepValidation("guardian", draft));

      act(() => result.current.validateAndTouch());

      expect(result.current.errors["guardian.fullName"]).toBe("Full name is required");
      expect(result.current.errors["guardian.email"]).toBe("Email is required");
      expect(result.current.errors["guardian.phone"]).toBe("Phone number is required");
      expect(result.current.errors["guardian.relationship"]).toBe("Please select your relationship to the student");
    });

    it("validates email format", () => {
      const draft = createDraft({ guardian: { fullName: "Parent", email: "invalid", phone: "555", relationship: "mother" } });
      const { result } = renderHook(() => useStepValidation("guardian", draft));

      act(() => result.current.validateAndTouch());

      expect(result.current.errors["guardian.email"]).toBe("Enter a valid email address");
    });

    it("returns isValid true when all fields valid", () => {
      const draft = createDraft({ guardian: { fullName: "Parent", email: "parent@test.com", phone: "555-555-5555", relationship: "mother" } });
      const { result } = renderHook(() => useStepValidation("guardian", draft));

      expect(result.current.isValid).toBe(true);
    });

    it("only shows errors for touched fields", () => {
      const draft = createDraft();
      const { result } = renderHook(() => useStepValidation("guardian", draft));

      expect(result.current.errors).toEqual({});

      act(() => result.current.touch("guardian.fullName"));

      expect(result.current.errors["guardian.fullName"]).toBe("Full name is required");
      expect(result.current.errors["guardian.email"]).toBeUndefined();
    });
  });

  describe("student step", () => {
    it("returns errors for empty required fields", () => {
      const draft = createDraft();
      const { result } = renderHook(() => useStepValidation("student", draft));

      act(() => result.current.validateAndTouch());

      expect(result.current.errors["student.fullName"]).toBe("Student full name is required");
      expect(result.current.errors["student.dateOfBirth"]).toBe("Date of birth is required");
    });

    it("returns isValid true when all fields valid", () => {
      const draft = createDraft({ student: { fullName: "Student", dateOfBirth: "2010-01-01" } });
      const { result } = renderHook(() => useStepValidation("student", draft));

      expect(result.current.isValid).toBe(true);
    });
  });

  describe("waivers step", () => {
    it("returns errors for unchecked required waivers", () => {
      const draft = createDraft();
      const { result } = renderHook(() => useStepValidation("waivers", draft));

      act(() => result.current.validateAndTouch());

      expect(result.current.errors["waivers.liabilityWaiver"]).toBe("Please agree to the liability waiver");
      expect(result.current.errors["waivers.medicalConsent"]).toBe("Please consent to medical treatment authorization");
      expect(result.current.errors["waivers.termsAgreement"]).toBe("Please agree to the terms and policies");
      expect(result.current.errors["waivers.signatureText"]).toBe("Please type your full name as a signature");
      expect(result.current.errors["waivers.signedAt"]).toBe("Please add today’s date");
    });

    it("returns isValid true when all waivers signed", () => {
      const draft = createDraft({
        waivers: {
          liabilityWaiver: true,
          photoConsent: true,
          medicalConsent: true,
          termsAgreement: true,
          signatureText: "Parent Name",
          signedAt: "2026-03-18",
        },
      });
      const { result } = renderHook(() => useStepValidation("waivers", draft));

      expect(result.current.isValid).toBe(true);
    });
  });

  describe("details step", () => {
    it("validates BJJ-specific fields", () => {
      const draft = createDraft({
        programSlug: "bjj",
        programDetails: {
          programSpecific: { gender: "", ageGroup: "", trialClass: "", notes: "" },
        },
      });
      const { result } = renderHook(() => useStepValidation("details", draft));

      act(() => result.current.validateAndTouch());

      expect(result.current.errors["programSpecific.gender"]).toBe("Please select a class group");
      expect(result.current.errors["programSpecific.ageGroup"]).toBe("Please select an age group");
    });

    it("validates archery-specific fields", async () => {
      const draft = createDraft({
        programSlug: "archery",
        programDetails: {
          programSpecific: { dominantHand: "", experience: "", sessionDate: "", notes: "" },
        },
      });
      const { result } = renderHook(() => useStepValidation("details", draft));

      act(() => result.current.validateAndTouch());

      await waitFor(() => {
        expect(result.current.errors["programSpecific.dominantHand"]).toBe("Please select your dominant hand");
        expect(result.current.errors["programSpecific.sessionDate"]).toBe("Please select a session");
      });
    });

    it("validates outdoor-specific fields", async () => {
      const draft = createDraft({
        programSlug: "outdoor",
        programDetails: {
          programSpecific: { workshopDate: "", gear: [], notes: "" },
        },
      });
      const { result } = renderHook(() => useStepValidation("details", draft));

      act(() => result.current.validateAndTouch());

      await waitFor(() => {
        expect(result.current.errors["programSpecific.workshopDate"]).toBe("Please select a workshop date");
        expect(result.current.errors["programSpecific.gear"]).toBe("Please confirm you have the required gear");
      });
    });

    it("validates bullyproofing-specific fields", async () => {
      const draft = createDraft({
        programSlug: "bullyproofing",
        programDetails: {
          programSpecific: { concernType: "", ageGroup: "", notes: "" },
        },
      });
      const { result } = renderHook(() => useStepValidation("details", draft));

      act(() => result.current.validateAndTouch());

      await waitFor(() => {
        expect(result.current.errors["programSpecific.concernType"]).toBe("Please select the primary concern");
        expect(result.current.errors["programSpecific.ageGroup"]).toBe("Please select an age group");
      });
    });
  });

  describe("unknown step", () => {
    it("returns empty errors for unknown step", () => {
      const draft = createDraft();
      const { result } = renderHook(() => useStepValidation("unknown", draft));

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });
});
