import { vi } from "vitest";
import { setupBrowserMocks } from "../mocks/browser";
import { server } from "./mocks/server";
import { resetMockStore } from "./mocks/handlers";

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

// Increase timeout for integration tests
vi.setConfig({ testTimeout: 30000 });
