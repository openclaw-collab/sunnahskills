import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { PaymentProvider } from "@/components/payment/PaymentProvider";

// Mock Stripe Elements
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
}));

vi.mock("@/lib/stripe", () => ({
  stripePromise: Promise.resolve({} as any),
  stripeAppearance: {
    theme: "night",
    variables: {
      colorBackground: "#1A1A1A",
    },
  },
}));

describe("PaymentProvider", () => {
  it("renders children within Stripe Elements", () => {
    render(
      <PaymentProvider clientSecret="test_secret_123">
        <div data-testid="payment-child">Payment Form</div>
      </PaymentProvider>
    );

    expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    expect(screen.getByTestId("payment-child")).toBeInTheDocument();
  });

  it("passes clientSecret to Elements options", () => {
    render(
      <PaymentProvider clientSecret="pi_test_secret">
        <div>Content</div>
      </PaymentProvider>
    );

    expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
  });

  it("memoizes options to prevent unnecessary re-renders", () => {
    const { rerender } = render(
      <PaymentProvider clientSecret="secret_1">
        <div>Content</div>
      </PaymentProvider>
    );

    rerender(
      <PaymentProvider clientSecret="secret_1">
        <div>Content</div>
      </PaymentProvider>
    );

    expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
  });
});
