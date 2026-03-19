import type { Meta, StoryObj } from '@storybook/react';
import { ProgressIndicator, type ProgressStep } from '../ProgressIndicator';

const STEPS: ProgressStep[] = [
  { id: 'guardian', label: 'Guardian' },
  { id: 'student', label: 'Student' },
  { id: 'details', label: 'Details' },
  { id: 'waivers', label: 'Waivers' },
  { id: 'payment', label: 'Payment' },
];

const meta: Meta<typeof ProgressIndicator> = {
  title: 'Registration/ProgressIndicator',
  component: ProgressIndicator,
  parameters: { layout: 'padded', backgrounds: { default: 'cream' } },
  tags: ['autodocs'],
  argTypes: {
    currentStepIndex: { control: { type: 'range', min: 0, max: 4, step: 1 } },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Step1: Story = {
  args: { steps: STEPS, currentStepIndex: 0 },
};

export const Step2: Story = {
  args: { steps: STEPS, currentStepIndex: 1 },
};

export const Step3: Story = {
  args: { steps: STEPS, currentStepIndex: 2 },
};

export const Step4: Story = {
  args: { steps: STEPS, currentStepIndex: 3 },
};

export const Step5Final: Story = {
  args: { steps: STEPS, currentStepIndex: 4 },
};

export const Interactive: Story = {
  args: { steps: STEPS, currentStepIndex: 2 },
};
