import type { RegistrationDraft } from "@/hooks/useRegistration";

export type RegistrationStepProps = {
  draft: RegistrationDraft;
  updateDraft: (updater: (prev: RegistrationDraft) => RegistrationDraft) => void;
};

