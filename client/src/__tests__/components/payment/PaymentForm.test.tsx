import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/__tests__/test-utils";
import { PaymentForm } from "@/components/payment/PaymentForm";

// Mock Stripe hooks
const mockConfirmPayment = vi.fn();
const mockUseStripe = vi.fn();
const mockUseElements = vi.fn();

vi.mock("@stripe/react-stripe-js", () => ({
  PaymentElement: () => <div data-testid="payment-element">Stripe Payment Element</div>,
  useStripe: () => mockUseStripe(),
  useElements: () => mockUseElements(),
}));

describe("PaymentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStripe.mockReturnValue({
      confirmPayment: mockConfirmPayment,
    });
    mockUseElements.mockReturnValue({});
  });

  it("renders payment element inside dark card", () => {
    render(<PaymentForm returnUrl="/success" />);

    expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    expect(screen.getByText("Payment Details")).toBeInTheDocument();
  });

  it("renders submit button with correct text", () => {
    render(<PaymentForm returnUrl="/success" />);

    expect(screen.getByRole("button", { name: /complete payment/i })).toBeInTheDocument();
  });

  it("disables submit button when stripe is not loaded", () => {
    mockUseStripe.mockReturnValue(null);
    mockUseElements.mockReturnValue(null);

    render(<PaymentForm returnUrl="/success" />);

    expect(screen.getByRole("button", { name: /complete payment/i })).toBeDisabled();
  });

  it("shows processing state during submission", async () => {
    mockConfirmPayment.mockImplementation(() => new Promise(() => {}));

    render(<PaymentForm returnUrl="/success" />);

    const form = screen.getByRole("button", { name: /complete payment/i }).closest("form");
    fireEvent.submit(form!);

    expect(screen.getByRole("button", { name: /processing/i })).toBeInTheDocument();
  });

  it("calls confirmPayment with correct parameters on submit", async () => {
    mockConfirmPayment.mockResolvedValue({ error: null });

    render(<PaymentForm returnUrl="/success" />);

    const form = screen.getByRole("button", { name: /complete payment/i }).closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalledWith({
        elements: {},
        confirmParams: { return_url: "/success" },
        redirect: "if_required",
      });
    });
  });

  it("displays error message when payment fails", async () => {
    mockConfirmPayment.mockResolvedValue({
      error: { message: "Card was declined" },
    });

    render(<PaymentForm returnUrl="/success" />);

    const form = screen.getByRole("button", { name: /complete payment/i }).closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText("Card was declined")).toBeInTheDocument();
    });
  });

  it("calls onSuccess when payment succeeds", async () => {
    const onSuccess = vi.fn();
    mockConfirmPayment.mockResolvedValue({ error: null });

    render(<PaymentForm returnUrl="/success" onSuccess={onSuccess} />);

    const form = screen.getByRole("button", { name: /complete payment/i }).closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("shows generic error message when error has no message", async () => {
    mockConfirmPayment.mockResolvedValue({
      error: {},
    });

    render(<PaymentForm returnUrl="/success" />);

    const form = screen.getByRole("button", { name: /complete payment/i }).closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    });
  });
});
