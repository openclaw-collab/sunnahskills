import type { Meta, StoryObj } from '@storybook/react';
import { DarkCard } from '../DarkCard';
import { ClayButton } from '../ClayButton';

const meta: Meta<typeof DarkCard> = {
  title: 'Brand/DarkCard',
  component: DarkCard,
  parameters: { layout: 'centered', backgrounds: { default: 'cream' } },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Card content goes here.', className: 'w-80' },
};

export const ProgramCard: Story = {
  args: {
    className: 'w-80',
    children: (
      <div className="space-y-3">
        <h3 className="font-heading text-xl text-cream">BJJ Program</h3>
        <p className="text-cream/70 text-sm">Learn the gentle art of Brazilian Jiu-Jitsu.</p>
        <ClayButton>Enroll Now</ClayButton>
      </div>
    ),
  },
};

export const TelemetryStyle: Story = {
  args: {
    className: 'w-80',
    children: (
      <div className="space-y-2">
        <span className="font-mono text-xs uppercase tracking-widest text-moss/60">Enrollment</span>
        <h3 className="font-heading text-lg text-cream">12 / 16 Spots Filled</h3>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-clay h-2 rounded-full" style={{ width: '75%' }} />
        </div>
      </div>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 bg-cream p-8 rounded-2xl">
      {['BJJ', 'Archery', 'Outdoor', 'Bullyproofing'].map((p) => (
        <DarkCard key={p} className="p-4">
          <h4 className="text-cream font-semibold">{p}</h4>
          <p className="text-cream/60 text-xs mt-1">Youth Program</p>
        </DarkCard>
      ))}
    </div>
  ),
};
