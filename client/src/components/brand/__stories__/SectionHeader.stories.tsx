import type { Meta, StoryObj } from '@storybook/react';
import { SectionHeader } from '../SectionHeader';

const meta: Meta<typeof SectionHeader> = {
  title: 'Brand/SectionHeader',
  component: SectionHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    className: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { eyebrow: 'Programs', title: 'Our Martial Arts Programs' },
};

export const NoEyebrow: Story = {
  args: { title: 'Building Character Through Discipline' },
};

export const LongTitle: Story = {
  args: {
    eyebrow: 'Registration',
    title: 'Brazilian Jiu-Jitsu Youth Program — Spring Session 2026',
  },
};

export const ReactNodeEyebrow: Story = {
  args: {
    eyebrow: (
      <span className="text-clay">↗ Featured</span>
    ),
    title: 'Archery Fundamentals',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-10 bg-cream p-8 rounded-2xl">
      <SectionHeader eyebrow="Programs" title="Our Martial Arts Programs" />
      <SectionHeader title="No Eyebrow Heading" />
      <SectionHeader eyebrow="About" title="Building Character Through Discipline" className="max-w-md" />
    </div>
  ),
};
