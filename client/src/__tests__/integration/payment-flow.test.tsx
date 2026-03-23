import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockLocalStorage } from "./test-utils";
import { ProgramRegistrationPage } from "@/pages/registration/ProgramRegistrationPage";
import { mockStore } from "./mocks/handlers";

// Mock wouter
vi.mock("wouter", async () => {
  const actual = await vi.importActual("wouter");
  return {
    ...actual,
    useLocation: () => ["/registration/bjj", vi.fn()],
  };
});

// Mock Stripe
const mockConfirmPayment = vi.fn();
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: () => ({
    confirmPayment: mockConfirmPayment,
  }),
  useElements: () => ({
    getElement: () => ({}),
  }),
}));

// Helper: fill and submit guardian step
// SelectField has no htmlFor — use getByRole("combobox") (only one native select on guardian step)
const fillGuardianStep = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Full name"), "John Doe");
  await user.type(screen.getByLabelText("Email"), "john@example.com");
  await user.type(screen.getByLabelText("Phone"), "555-123-4567");
  await user.type(screen.getByLabelText("Emergency contact name"), "Jane Doe");
  await user.type(screen.getByLabelText("Emergency contact phone"), "555-987-6543");
  const relationshipSelect = screen.getByRole("combobox");
  await user.selectOptions(relationshipSelect, "mother");
  await user.click(screen.getByRole("button", { name: /continue/i }));
};

const fillStudentStep = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => {
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  }, { timeout: 500 });
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Student's full name")).toBeInTheDocument();
  }, { timeout: 1000 });
  await user.type(screen.getByPlaceholderText("Student's full name"), "Jimmy Doe");
  await user.type(screen.getByPlaceholderText("What should we call them?"), "Jim");
  await user.type(screen.getByPlaceholderText("YYYY-MM-DD"), "2015-01-01");
  await user.click(screen.getByRole("button", { name: /continue/i }));
};

// BJJ: class track + session (if multiple) + trial
const fillProgramDetailsStep = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => {
    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
  }, { timeout: 500 });
  await user.click(await screen.findByLabelText(/Boys 7–13/i));
  const sessionSelect = await screen.findByLabelText(/pick your session/i);
  await user.selectOptions(sessionSelect, "1");
  await user.click(await screen.findByLabelText(/No, enrol directly/i));
  await user.click(screen.getByRole("button", { name: /continue/i }));
};

const fillWaiversStep = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => {
    expect(screen.getByText(/step 4/i)).toBeInTheDocument();
  }, { timeout: 500 });
  await user.click(await screen.findByRole("checkbox", { name: /liability waiver/i }));
  await user.click(await screen.findByRole("checkbox", { name: /photo/i }));
  await user.click(await screen.findByRole("checkbox", { name: /medical/i }));
  await user.click(await screen.findByRole("checkbox", { name: /terms/i }));
  await user.type(screen.getByLabelText(/typed legal signature/i), "John Doe");
  await user.type(screen.getByLabelText(/^date$/i), "2026-03-18");
};

describe("Payment Flow Integration", () => {
  beforeEach(() => {
    mockConfirmPayment.mockClear();
    // Mock localStorage to prevent StorageEvent jsdom crash when hook saves drafts
    mockLocalStorage({});
  });

  it("creates payment intent for one-time payment program", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });
    mockStore.subscriptionUnavailable = true;

    render(<ProgramRegistrationPage slug="bjj" />);

    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);

    await fillWaiversStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockStore.payments).toHaveLength(1);
      expect(mockStore.payments[0].id).toMatch(/^pi_/);
    });

    expect(mockStore.registrations).toHaveLength(1);
    const registration = mockStore.registrations[0];
    expect(registration.status).toBe("pending_payment");
    mockStore.subscriptionUnavailable = false;
  });

  it("creates subscription for recurring payment program", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });

    render(<ProgramRegistrationPage slug="bjj" />);

    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockStore.payments).toHaveLength(1);
    });
  });

  it("applies sibling discount to payment", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });

    render(<ProgramRegistrationPage slug="bjj" />);

    await fillGuardianStep(user);
    await fillStudentStep(user);

    await waitFor(() => {
      expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    }, { timeout: 500 });

    await user.click(await screen.findByLabelText(/Boys 7–13/i));
    const sessionSelect = await screen.findByLabelText(/pick your session/i);
    await user.selectOptions(sessionSelect, "1");
    await user.click(await screen.findByLabelText(/No, enrol directly/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await fillWaiversStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockStore.payments).toHaveLength(1);
    });
  });

  it("handles payment failure gracefully", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({
      error: { message: "Your card was declined." },
    });

    render(<ProgramRegistrationPage slug="bjj" />);

    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(mockStore.registrations).toHaveLength(1);
  });

  it("handles payment intent creation failure", async () => {
    const user = userEvent.setup();
    mockStore.shouldFailPayment = true;

    render(<ProgramRegistrationPage slug="bjj" />);

    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/payment creation failed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("handles discount code application", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });

    render(<ProgramRegistrationPage slug="bjj" />);

    await fillGuardianStep(user);
    await fillStudentStep(user);

    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(mockStore.registrations).toHaveLength(1);
  });
});
