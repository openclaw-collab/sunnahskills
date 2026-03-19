import type { Meta, StoryObj } from '@storybook/react';
import { AdminOverview } from '../AdminOverview';

const meta: Meta<typeof AdminOverview> = {
  title: 'Admin/AdminOverview',
  component: AdminOverview,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

const REGISTRATIONS = [
  {
    registration_id: 42,
    registration_status: 'active',
    program_name: 'BJJ Youth',
    payment_status: 'paid',
    payment_amount: 14900,
  },
  {
    registration_id: 41,
    registration_status: 'pending_payment',
    program_name: 'Archery',
    payment_status: 'pending',
    payment_amount: null,
  },
  {
    registration_id: 40,
    registration_status: 'active',
    program_name: 'BJJ Youth',
    payment_status: 'paid',
    payment_amount: 14900,
  },
  {
    registration_id: 39,
    registration_status: 'waitlisted',
    program_name: 'Outdoor Workshop',
    payment_status: null,
    payment_amount: null,
  },
];

const PAYMENTS = [
  { payment_id: 10, status: 'paid', amount: 14900, currency: 'USD' },
  { payment_id: 9, status: 'paid', amount: 14900, currency: 'USD' },
  { payment_id: 8, status: 'failed', amount: 9900, currency: 'USD' },
];

export const Default: Story = {
  args: {
    registrations: REGISTRATIONS,
    payments: PAYMENTS,
  },
};

export const Empty: Story = {
  args: {
    registrations: [],
    payments: [],
  },
};

export const HighVolume: Story = {
  args: {
    registrations: Array.from({ length: 20 }, (_, i) => ({
      registration_id: i + 1,
      registration_status: i % 3 === 0 ? 'pending_payment' : 'active',
      program_name: ['BJJ Youth', 'Archery', 'Outdoor Workshop', 'Bullyproofing'][i % 4],
      payment_status: i % 3 === 0 ? null : 'paid',
      payment_amount: i % 3 === 0 ? null : 14900,
    })),
    payments: Array.from({ length: 15 }, (_, i) => ({
      payment_id: i + 1,
      status: 'paid',
      amount: 14900,
      currency: 'USD',
    })),
  },
};
