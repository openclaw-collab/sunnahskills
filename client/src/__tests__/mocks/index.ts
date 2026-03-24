/**
 * Mock implementations for external services and browser APIs.
 * 
 * @example
 * ```typescript
 * import { mockStripe, setupStripeMock, mockSuccessfulPayment } from '@/__tests__/mocks';
 * 
 * // Setup Stripe mock
 * setupStripeMock();
 * 
 * // Mock a successful payment
 * mockSuccessfulPayment('pi_test_123');
 * ```
 */

// Stripe mocks
export {
  mockStripe,
  mockStripeElement,
  mockStripeElements,
  mockLoadStripe,
  setupStripeMock,
  resetStripeMocks,
  mockSuccessfulPayment,
  mockFailedPayment,
  mockPaymentRequiresAction,
} from "./stripe";

// D1 database mocks
export {
  MockD1Database,
  MockD1PreparedStatement,
  createMockD1Database,
  createMockD1Binding,
  resetD1Mocks,
} from "./d1";

// MailChannels mocks
export {
  MockMailChannels,
  createMockMailChannels,
  mockMailChannelsSuccess,
  mockMailChannelsError,
  setupMailChannelsMock,
  resetMailChannelsMocks,
  mockSendEmail,
  type EmailMessage,
  type SentEmail,
} from "./mailchannels";

// Browser API mocks
export {
  MockStorage,
  MockIntersectionObserver,
  MockResizeObserver,
  MockClipboard,
  createMatchMediaMock,
  setupMatchMedia,
  createMockFetch,
  mockScrollMethods,
  setupBrowserMocks,
  type MockMediaQueryList,
} from "./browser";
