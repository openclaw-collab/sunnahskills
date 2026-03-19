import type { Meta, StoryObj } from '@storybook/react';
import { ClayButton } from '../ClayButton';

const meta: Meta<typeof ClayButton> = {
  title: 'Brand/ClayButton',
  component: ClayButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Get Started' },
};

export const LongText: Story = {
  args: { children: 'Register for Brazilian Jiu-Jitsu Program' },
};

export const Disabled: Story = {
  args: { children: 'Processing...', disabled: true },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <ClayButton>Default</ClayButton>
      <ClayButton disabled>Disabled</ClayButton>
      <ClayButton className="opacity-75">Custom Class</ClayButton>
    </div>
  ),
};
