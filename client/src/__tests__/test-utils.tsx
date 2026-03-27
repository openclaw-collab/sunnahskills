import React, { ReactElement, ReactNode } from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { StudioProvider } from "@/studio/StudioProvider";

// ============================================================================
// Query Client Factory for Tests
// ============================================================================

/**
 * Creates a new QueryClient with test-optimized defaults.
 * Each test should create its own client to ensure isolation.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Provider Wrapper Components
// ============================================================================

interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wraps children with all necessary providers for testing.
 */
export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient ?? createTestQueryClient();
  return (
    <StudioProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </StudioProvider>
  );
}

// ============================================================================
// Custom Render Functions
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Renders a component with all necessary providers.
 * Automatically wraps with QueryClientProvider.
 */
export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, ...renderOptions } = options;
  const client = queryClient ?? createTestQueryClient();

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <StudioProvider>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </StudioProvider>
    ),
    ...renderOptions,
  });
}

/**
 * Renders a hook with all necessary providers.
 * Use with renderHook from @testing-library/react.
 */
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <StudioProvider>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </StudioProvider>
    );
  };
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Waits for a specified duration.
 * Use sparingly - prefer waiting for specific conditions.
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flushes all pending promises.
 * Useful for async operations that don't have explicit loading states.
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// Form Testing Utilities
// ============================================================================

/**
 * Simulates typing into an input field with proper event sequence.
 */
export function simulateTyping(
  input: HTMLElement,
  value: string
): Promise<void> {
  // Use the userEvent pattern but with fireEvent for simple cases
  input.focus();
  // Let the caller use user-event library for complex interactions
  return Promise.resolve();
}

/**
 * Creates a mock file for file input testing.
 */
export function createMockFile(
  name: string,
  size: number = 1024,
  type: string = "application/pdf"
): File {
  const content = new Array(size).fill("a").join("");
  return new File([content], name, { type });
}

// ============================================================================
// Re-exports from Testing Library
// ============================================================================

export {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  fireEvent,
} from "@testing-library/react";
export { renderHook, act } from "@testing-library/react";
