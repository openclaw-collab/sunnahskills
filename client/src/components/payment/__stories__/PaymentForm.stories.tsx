import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Payment/PaymentForm',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

// PaymentForm requires Stripe Elements context (useStripe / useElements hooks).
// These stories render a mock shell that matches the visual layout without
// requiring a live Stripe client secret.

function MockPaymentFormShell({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div className="space-y-4 w-96">
      {/* Mirrors DarkCard + PaymentElement layout */}
      <div className="rounded-2xl bg-charcoal px-6 py-5 text-cream">
        <div
          className="font-mono text-[11px] text-cream/70 uppercase tracking-[0.2em] mb-4"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Payment Details
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-cream/60 uppercase tracking-wider block mb-1">
              Card number
            </label>
            <div className="bg-cream/10 border border-cream/20 rounded-lg px-3 py-2.5 text-cream/40 text-sm">
              4242 4242 4242 4242
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-cream/60 uppercase tracking-wider block mb-1">
                Expiry
              </label>
              <div className="bg-cream/10 border border-cream/20 rounded-lg px-3 py-2.5 text-cream/40 text-sm">
                12 / 28
              </div>
            </div>
            <div>
              <label className="text-[11px] text-cream/60 uppercase tracking-wider block mb-1">
                CVC
              </label>
              <div className="bg-cream/10 border border-cream/20 rounded-lg px-3 py-2.5 text-cream/40 text-sm">
                •••
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onSuccess}
        className="w-full bg-clay text-cream rounded-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] hover:bg-clay/90 transition-colors"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Complete Payment
      </button>
    </div>
  );
}

function MockPaymentFormError() {
  return (
    <div className="space-y-4 w-96">
      <div className="rounded-2xl bg-charcoal px-6 py-5 text-cream">
        <div
          className="font-mono text-[11px] text-cream/70 uppercase tracking-[0.2em] mb-4"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Payment Details
        </div>
        <div className="bg-cream/10 border border-cream/20 rounded-lg px-3 py-8 text-cream/30 text-sm text-center">
          [Stripe PaymentElement]
        </div>
      </div>

      <div className="text-sm text-clay" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Your card was declined. Please try a different payment method.
      </div>

      <button
        className="w-full bg-clay text-cream rounded-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] hover:bg-clay/90 transition-colors"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Complete Payment
      </button>
    </div>
  );
}

function MockPaymentFormProcessing() {
  return (
    <div className="space-y-4 w-96">
      <div className="rounded-2xl bg-charcoal px-6 py-5 text-cream">
        <div
          className="font-mono text-[11px] text-cream/70 uppercase tracking-[0.2em] mb-4"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Payment Details
        </div>
        <div className="bg-cream/10 border border-cream/20 rounded-lg px-3 py-8 text-cream/30 text-sm text-center">
          [Stripe PaymentElement]
        </div>
      </div>

      <button
        disabled
        className="w-full bg-clay/50 text-cream/50 rounded-full px-7 py-3.5 text-[11px] uppercase tracking-[0.18em] cursor-not-allowed"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        Processing...
      </button>
    </div>
  );
}

export const Default: Story = {
  render: () => <MockPaymentFormShell onSuccess={() => console.log('payment success')} />,
};

export const WithError: Story = {
  render: () => <MockPaymentFormError />,
};

export const Processing: Story = {
  render: () => <MockPaymentFormProcessing />,
};
