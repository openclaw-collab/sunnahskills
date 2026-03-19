import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { StepWaivers } from '../StepWaivers';
import type { RegistrationDraft } from '@/hooks/useRegistration';

const BASE_DRAFT: RegistrationDraft = {
  programSlug: 'bjj',
  guardian: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0100',
    emergencyContactName: 'Bob Smith',
    emergencyContactPhone: '555-0101',
    relationship: 'Spouse',
  },
  student: {
    fullName: 'Alex Smith',
    preferredName: 'Alex',
    dateOfBirth: '2015-06-01',
    age: 10,
    gender: 'male',
    skillLevel: 'beginner',
    medicalNotes: '',
  },
  programDetails: {
    sessionId: 1,
    priceId: 1,
    siblingCount: 0,
    programSpecific: { gender: 'boys', ageGroup: '6-10', trialClass: 'no', notes: '' },
  },
  waivers: {
    liabilityWaiver: false,
    photoConsent: false,
    medicalConsent: false,
    termsAgreement: false,
    signatureText: '',
    signedAt: '',
  },
  payment: { discountCode: '' },
};

const SIGNED_DRAFT: RegistrationDraft = {
  ...BASE_DRAFT,
  waivers: {
    liabilityWaiver: true,
    photoConsent: true,
    medicalConsent: true,
    termsAgreement: true,
    signatureText: 'Jane Smith',
    signedAt: '2026-03-19',
  },
};

function WaiversWrapper({ initialDraft }: { initialDraft: RegistrationDraft }) {
  const [draft, setDraft] = useState(initialDraft);
  return (
    <div className="bg-cream p-6 rounded-2xl max-w-xl">
      <StepWaivers
        draft={draft}
        updateDraft={(updater) => setDraft((prev) => updater(prev))}
      />
    </div>
  );
}

const meta: Meta = {
  title: 'Registration/StepWaivers',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Empty: Story = {
  render: () => <WaiversWrapper initialDraft={BASE_DRAFT} />,
};

export const AllSigned: Story = {
  render: () => <WaiversWrapper initialDraft={SIGNED_DRAFT} />,
};
