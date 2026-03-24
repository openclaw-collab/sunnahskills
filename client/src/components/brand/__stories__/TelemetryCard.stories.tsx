import type { Meta, StoryObj } from '@storybook/react';
import { TelemetryCard } from '../TelemetryCard';

const meta: Meta<typeof TelemetryCard> = {
  title: 'Brand/TelemetryCard',
  component: TelemetryCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    label: { control: 'text' },
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Enrollment',
    title: '12 / 16 Spots Filled',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Technique',
    title: 'Uchi-mata → Armbar',
    icon: <span className="text-xl">🥋</span>,
  },
};

export const WithChildren: Story = {
  args: {
    label: 'Progress',
    title: 'Belt Progression',
    icon: <span className="text-xl">🏅</span>,
    children: (
      <div className="flex gap-2">
        {['White', 'Grey', 'Yellow', 'Orange', 'Green'].map((belt) => (
          <div key={belt} className="h-2 flex-1 rounded-full bg-charcoal/10 first:bg-clay" />
        ))}
      </div>
    ),
  },
};

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[700px]">
      <TelemetryCard label="Students" title="48 Enrolled" icon={<span>👥</span>} />
      <TelemetryCard label="Revenue" title="$7,152 / mo" icon={<span>💰</span>} />
      <TelemetryCard label="Sessions" title="3 Active" icon={<span>📅</span>} />
    </div>
  ),
};
