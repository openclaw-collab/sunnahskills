import React from "react";
import { render as rtlRender, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a custom render with providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

interface RenderOptions {
  route?: string;
  user?: ReturnType<typeof userEvent.setup>;
}

export function render(ui: React.ReactElement, options: RenderOptions = {}) {
  const queryClient = createTestQueryClient();
  const user = options.user || userEvent.setup();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const result = rtlRender(ui, { wrapper: Wrapper });

  return {
    ...result,
    user,
    queryClient,
  };
}

// Helper to fill out a form field by label
export async function fillField(
  user: ReturnType<typeof userEvent.setup>,
  labelText: string | RegExp,
  value: string
) {
  const field = screen.getByLabelText(labelText);
  await user.clear(field);
  await user.type(field, value);
  return field;
}

// Helper to select a radio option
export async function selectRadio(
  user: ReturnType<typeof userEvent.setup>,
  labelText: string | RegExp
) {
  const radio = screen.getByLabelText(labelText);
  await user.click(radio);
  return radio;
}

// Helper to select from a dropdown (custom select component)
export async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  triggerLabel: string | RegExp,
  optionText: string | RegExp
) {
  const trigger = screen.getByRole("combobox", { name: triggerLabel });
  await user.click(trigger);

  // Wait for the dropdown to open
  await waitFor(() => {
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  const listbox = screen.getByRole("listbox");
  const option = within(listbox).getByText(optionText);
  await user.click(option);
}

// Helper to click a button
export async function clickButton(
  user: ReturnType<typeof userEvent.setup>,
  name: string | RegExp
) {
  const button = screen.getByRole("button", { name });
  await user.click(button);
  return button;
}

// Helper to wait for loading to finish
export async function waitForLoadingToFinish() {
  await waitFor(
    () => {
      const loadingElements = screen.queryAllByText(/loading|loading…/i);
      expect(loadingElements).toHaveLength(0);
    },
    { timeout: 5000 }
  );
}

// Helper to mock localStorage
export function mockLocalStorage(data: Record<string, any>) {
  const getItem = jest.fn((key: string) => {
    const value = data[key];
    return value ? JSON.stringify(value) : null;
  });
  const setItem = jest.fn();
  const removeItem = jest.fn();
  const clear = jest.fn();

  Object.defineProperty(window, "localStorage", {
    value: { getItem, setItem, removeItem, clear },
    writable: true,
  });

  return { getItem, setItem, removeItem, clear };
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { userEvent };
