import type { Meta, StoryObj } from '@storybook/react';
import { RegistrationsTable } from '../RegistrationsTable';

const meta: Meta<typeof RegistrationsTable> = {
  title: 'Admin/RegistrationsTable',
  component: RegistrationsTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    onOpen: { action: 'opened' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

const ROWS = [
  {
    registration_id: 42,
    registration_status: 'active',
    created_at: '2026-03-15',
    program_name: 'BJJ Youth',
    program_slug: 'bjj',
    guardian_name: 'Jane Smith',
    guardian_email: 'jane@example.com',
    student_name: 'Alex Smith',
    payment_status: 'paid',
    payment_amount: 14900,
  },
  {
    registration_id: 41,
    registration_status: 'pending_payment',
    created_at: '2026-03-14',
    program_name: 'Archery',
    program_slug: 'archery',
    guardian_name: 'Omar Hassan',
    guardian_email: 'omar@example.com',
    student_name: 'Yusuf Hassan',
    payment_status: 'pending',
    payment_amount: null,
  },
  {
    registration_id: 40,
    registration_status: 'waitlisted',
    created_at: '2026-03-12',
    program_name: 'Outdoor Workshop',
    program_slug: 'outdoor',
    guardian_name: 'Sara Ali',
    guardian_email: 'sara@example.com',
    student_name: 'Fatima Ali',
    payment_status: null,
    payment_amount: null,
  },
  {
    registration_id: 39,
    registration_status: 'active',
    created_at: '2026-03-10',
    program_name: 'Bullyproofing',
    program_slug: 'bullyproofing',
    guardian_name: 'David Chen',
    guardian_email: 'david@example.com',
    student_name: 'Lily Chen',
    payment_status: 'paid',
    payment_amount: 19900,
  },
];

export const Default: Story = {
  args: {
    initial: ROWS,
    onOpen: (id: number) => console.log('opened', id),
  },
};

export const Empty: Story = {
  args: {
    initial: [],
    onOpen: (id: number) => console.log('opened', id),
  },
};

export const MixedStatuses: Story = {
  args: {
    initial: [
      { ...ROWS[0], registration_status: 'submitted', payment_status: null, payment_amount: null },
      { ...ROWS[1], registration_status: 'cancelled', payment_status: 'failed', payment_amount: 9900 },
      { ...ROWS[2], registration_status: 'active', payment_status: 'paid', payment_amount: 14900 },
    ],
    onOpen: (id: number) => console.log('opened', id),
  },
};
