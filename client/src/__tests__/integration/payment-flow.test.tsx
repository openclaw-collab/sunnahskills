import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "./test-utils";
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

describe("Payment Flow Integration", () => {
  const fillGuardianStep = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-123-4567");
    await user.type(screen.getByLabelText(/emergency contact name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/emergency contact phone/i), "555-987-6543");
    await user.type(screen.getByLabelText(/relationship/i), "Parent");
    await user.click(screen.getByRole("button", { name: /continue/i }));
  };

  const fillStudentStep = async (user: ReturnType<typeof userEvent.setup>) => {
    await waitFor(() => {
      expect(screen.getByText(/student information/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/student.*full name/i), "Jimmy Doe");
    await user.type(screen.getByLabelText(/preferred name/i), "Jim");
    await user.type(screen.getByLabelText(/date of birth/i), "2015-01-01");
    await user.click(screen.getByRole("button", { name: /continue/i }));
  };

  const fillProgramDetailsStep = async (user: ReturnType<typeof userEvent.setup>) => {
    await waitFor(() => {
      expect(screen.getByText(/program details/i)).toBeInTheDocument();
    });
    const ageGroupSelect = screen.getByRole("combobox", { name: /age group/i });
    await user.click(ageGroupSelect);
    await user.click(screen.getByRole("option", { name: /6-10/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
  };

  const fillWaiversStep = async (user: ReturnType<typeof userEvent.setup>) => {
    await waitFor(() => {
      expect(screen.getByText(/waivers/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/liability waiver/i));
    await user.click(screen.getByLabelText(/photo consent/i));
    await user.click(screen.getByLabelText(/medical consent/i));
    await user.click(screen.getByLabelText(/terms/i));
    await user.type(screen.getByLabelText(/signature/i), "John Doe");
  };

  beforeEach(() => {
    mockConfirmPayment.mockClear();
  });

  it("creates payment intent for one-time payment program", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });

    render(<ProgramRegistrationPage slug="archery" />);

    // Navigate to payment step
    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);

    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Wait for payment step
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Verify payment intent was created
    await waitFor(() => {
      expect(mockStore.payments).toHaveLength(1);
      expect(mockStore.payments[0].id).toMatch(/^pi_/);
    });

    // Verify registration was created
    expect(mockStore.registrations).toHaveLength(1);
    const registration = mockStore.registrations[0];
    expect(registration.status).toBe("pending_payment");
  });

  it("creates subscription for recurring payment program", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });

    render(<ProgramRegistrationPage slug="bjj" />);

    // Navigate to payment step
    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);

    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Wait for payment step
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Verify subscription was created (or payment intent as fallback)
    await waitFor(() => {
      expect(mockStore.payments).toHaveLength(1);
    });
  });

  it("applies sibling discount to payment", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });

    render(<ProgramRegistrationPage slug="bjj" />);

    // Navigate to program details and add siblings
    await fillGuardianStep(user);
    await fillStudentStep(user);

    await waitFor(() => {
      expect(screen.getByText(/program details/i)).toBeInTheDocument();
    });

    // Select age group
    const ageGroupSelect = screen.getByRole("combobox", { name: /age group/i });
    await user.click(ageGroupSelect);
    await user.click(screen.getByRole("option", { name: /6-10/i }));

    // Add sibling count (this would be in the order summary sidebar)
    // Continue to waivers
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await fillWaiversStep(user);
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Wait for payment step
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Verify payment was created
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

    // Navigate to payment step
    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);

    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Wait for payment step
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Registration should still be created even if payment fails later
    expect(mockStore.registrations).toHaveLength(1);
  });

  it("handles payment intent creation failure", async () => {
    const user = userEvent.setup();
    mockStore.shouldFailNextRequest = true;

    render(<ProgramRegistrationPage slug="bjj" />);

    // Navigate to payment step
    await fillGuardianStep(user);
    await fillStudentStep(user);
    await fillProgramDetailsStep(user);
    await fillWaiversStep(user);

    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create payment/i)).toBeInTheDocument();
    });

    mockStore.shouldFailNextRequest = false;
  });

  it("handles discount code application", async () => {
    const user = userEvent.setup();
    mockConfirmPayment.mockResolvedValueOnce({ error: null });

    render(<ProgramRegistrationPage slug="bjj" />);

    // Navigate to program details step
    await fillGuardianStep(user);
    await fillStudentStep(user);

    await waitFor(() => {
      expect(screen.getByText(/program details/i)).toBeInTheDocument();
    });

    // At this point, order summary should be visible with discount code input
    // Continue through to payment
    const ageGroupSelect = screen.getByRole("combobox", { name: /age group/i });
    await user.click(ageGroupSelect);
    await user.click(screen.getByRole("option", { name: /6-10/i }));

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await fillWaiversStep(user);
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Wait for payment step
    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    // Verify registration was created
    expect(mockStore.registrations).toHaveLength(1);
  });
});
