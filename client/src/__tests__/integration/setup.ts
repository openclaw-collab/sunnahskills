import { vi } from "vitest";
import { setupBrowserMocks } from "../mocks/browser";
import { server } from "./mocks/server";
import { resetMockStore } from "./mocks/handlers";

vi.mock("@/lib/stripe", () => ({
  stripePromise: Promise.resolve(null),
  stripeAppearance: {},
}));

/**
 * Integration test setup.
 * This file is loaded by vitest for integration tests.
 */

// Setup MSW server
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  resetMockStore();
});
afterAll(() => server.close());

// Setup browser mocks
const { localStorage, sessionStorage } = setupBrowserMocks();

// Make mocks available globally for integration tests
declare global {
  var mockLocalStorage: typeof localStorage;
  var mockSessionStorage: typeof sessionStorage;
}

globalThis.mockLocalStorage = localStorage;
globalThis.mockSessionStorage = sessionStorage;

// Integration flows mount real route shells, MSW, and async React Query boundaries.
// Coverage mode is materially slower, so keep the suite deterministic instead of failing at 30s.
vi.setConfig({ testTimeout: 60000, hookTimeout: 60000 });
