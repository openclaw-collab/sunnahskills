import { vi } from "vitest";

/**
 * Mock Stripe.js for testing payment flows.
 * Provides mock implementations of Stripe Elements and Payment Intents.
 */

// ============================================================================
// Stripe Elements Mocks
// ============================================================================

export const mockStripeElement = {
  mount: vi.fn(),
  unmount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  update: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
};

export const mockStripeElements = {
  create: vi.fn(() => mockStripeElement),
  getElement: vi.fn(() => mockStripeElement),
  update: vi.fn(),
  fetchUpdates: vi.fn(() => Promise.resolve()),
};

// ============================================================================
// Stripe Types
// ============================================================================

interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  receipt_url?: string;
  client_secret?: string;
}

interface StripeError {
  type: string;
  code: string;
  message: string;
  decline_code?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface PaymentResult {
  paymentIntent?: PaymentIntent | null;
  error?: StripeError | null;
}

interface PaymentMethodResult {
  paymentMethod?: PaymentMethod | null;
  error?: StripeError | null;
}

// ============================================================================
// Stripe Instance Mock
// ============================================================================

export const mockStripe = {
  elements: vi.fn(() => mockStripeElements),
  createPaymentMethod: vi.fn((): Promise<PaymentMethodResult> =>
    Promise.resolve({
      paymentMethod: {
        id: "pm_test_123",
        type: "card",
        card: {
          brand: "visa",
          last4: "4242",
          exp_month: 12,
          exp_year: 2025,
        },
      },
      error: null,
    })
  ),
  confirmPayment: vi.fn((): Promise<PaymentResult> =>
    Promise.resolve({
      paymentIntent: {
        id: "pi_test_123",
        status: "succeeded",
        amount: 5000,
        currency: "usd",
      },
      error: null,
    })
  ),
  confirmCardPayment: vi.fn((): Promise<PaymentResult> =>
    Promise.resolve({
      paymentIntent: {
        id: "pi_test_123",
        status: "succeeded",
        amount: 5000,
        currency: "usd",
        client_secret: "pi_test_123_secret",
      },
      error: null,
    })
  ),
  retrievePaymentIntent: vi.fn((): Promise<{ paymentIntent: PaymentIntent }> =>
    Promise.resolve({
      paymentIntent: {
        id: "pi_test_123",
        status: "succeeded",
        amount: 5000,
        currency: "usd",
      },
    })
  ),
};

// ============================================================================
// Stripe.js Module Mock
// ============================================================================

export const mockLoadStripe = vi.fn(() => Promise.resolve(mockStripe));

/**
 * Setup function to mock @stripe/stripe-js module.
 * Call this in your test file or setup.
 */
export function setupStripeMock() {
  vi.mock("@stripe/stripe-js", () => ({
    loadStripe: mockLoadStripe,
  }));
}

/**
 * Resets all Stripe mocks to their initial state.
 */
export function resetStripeMocks() {
  mockStripeElement.mount.mockClear();
  mockStripeElement.unmount.mockClear();
  mockStripeElement.destroy.mockClear();
  mockStripeElements.create.mockClear();
  mockStripe.elements.mockClear();
  mockStripe.createPaymentMethod.mockClear();
  mockStripe.confirmPayment.mockClear();
  mockStripe.confirmCardPayment.mockClear();
  mockStripe.retrievePaymentIntent.mockClear();
  mockLoadStripe.mockClear();
}

/**
 * Simulates a successful payment confirmation.
 */
export function mockSuccessfulPayment(paymentIntentId = "pi_test_123") {
  mockStripe.confirmPayment.mockResolvedValueOnce({
    paymentIntent: {
      id: paymentIntentId,
      status: "succeeded",
      amount: 5000,
      currency: "usd",
      receipt_url: "https://pay.stripe.com/receipts/...",
    },
    error: null,
  });
}

/**
 * Simulates a failed payment confirmation.
 */
export function mockFailedPayment(errorMessage = "Your card was declined.") {
  mockStripe.confirmPayment.mockResolvedValueOnce({
    paymentIntent: null,
    error: {
      type: "card_error",
      code: "card_declined",
      message: errorMessage,
      decline_code: "generic_decline",
    },
  });
}

/**
 * Simulates a payment requiring additional authentication.
 */
export function mockPaymentRequiresAction(
  clientSecret = "pi_test_123_secret"
) {
  mockStripe.confirmPayment.mockResolvedValueOnce({
    paymentIntent: {
      id: "pi_test_123",
      status: "requires_action",
      amount: 5000,
      currency: "usd",
      client_secret: clientSecret,
    },
    error: null,
  });
}
