import type { Meta, StoryObj } from '@storybook/react';
import { PremiumCard } from '../PremiumCard';

const meta: Meta<typeof PremiumCard> = {
  title: 'Brand/PremiumCard',
  component: PremiumCard,
  parameters: { layout: 'centered', backgrounds: { default: 'charcoal' } },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: 'Program Details', className: 'w-80', children: 'Content goes here.' },
};

export const NoTitle: Story = {
  args: {
    className: 'w-80',
    children: <p className="text-charcoal/70">Content without a title.</p>,
  },
};

export const PricingCard: Story = {
  args: {
    title: 'BJJ Subscription',
    className: 'w-72',
    children: (
      <div className="space-y-2">
        <p className="text-3xl font-bold text-charcoal">$149<span className="text-base font-normal text-charcoal/50">/mo</span></p>
        <ul className="text-sm text-charcoal/70 space-y-1">
          <li>✓ 2 classes per week</li>
          <li>✓ Belt promotion system</li>
          <li>✓ Tournament prep</li>
        </ul>
      </div>
    ),
  },
};

export const SideBySide: Story = {
  render: () => (
    <div className="flex gap-4 bg-charcoal p-8 rounded-2xl">
      <PremiumCard title="BJJ" className="w-56">
        <p className="text-charcoal/70 text-sm">Monthly · $149</p>
      </PremiumCard>
      <PremiumCard title="Archery" className="w-56">
        <p className="text-charcoal/70 text-sm">Session · $249</p>
      </PremiumCard>
    </div>
  ),
};
