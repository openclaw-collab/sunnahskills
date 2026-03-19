import type { Meta, StoryObj } from '@storybook/react';
import { ProgramSummaryCard } from '../ProgramSummaryCard';
import { PROGRAMS } from '@/lib/programConfig';

const meta: Meta<typeof ProgramSummaryCard> = {
  title: 'Registration/ProgramSummaryCard',
  component: ProgramSummaryCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const BJJ: Story = {
  args: { program: PROGRAMS.bjj },
};

export const BJJWithSession: Story = {
  args: {
    program: PROGRAMS.bjj,
    selected: {
      sessionLabel: 'Spring 2026 — Mon/Wed/Sat',
      priceLabel: '$149/month',
    },
  },
};

export const Archery: Story = {
  args: { program: PROGRAMS.archery },
};

export const Outdoor: Story = {
  args: { program: PROGRAMS.outdoor },
};

export const Bullyproofing: Story = {
  args: { program: PROGRAMS.bullyproofing },
};

export const AllPrograms: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-6 bg-cream rounded-2xl">
      <ProgramSummaryCard program={PROGRAMS.bjj} />
      <ProgramSummaryCard program={PROGRAMS.archery} />
      <ProgramSummaryCard program={PROGRAMS.outdoor} />
      <ProgramSummaryCard program={PROGRAMS.bullyproofing} />
    </div>
  ),
};
