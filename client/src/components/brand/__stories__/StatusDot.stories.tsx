import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot } from '../StatusDot';

const meta: Meta<typeof StatusDot> = {
  title: 'Brand/StatusDot',
  component: StatusDot,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: 'text' },
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ariaLabel: 'Active' },
};

export const CustomColor: Story = {
  args: { ariaLabel: 'Inactive', className: 'bg-moss' },
};

export const InContext: Story = {
  render: () => (
    <div className="bg-charcoal p-6 rounded-2xl space-y-3">
      {[
        { label: 'Enrollment Open', color: '' },
        { label: 'Session Full', color: 'bg-moss animate-none opacity-40' },
        { label: 'Waitlist', color: 'bg-yellow-500' },
      ].map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <StatusDot ariaLabel={label} className={color || undefined} />
          <span className="text-cream text-sm">{label}</span>
        </div>
      ))}
    </div>
  ),
};
