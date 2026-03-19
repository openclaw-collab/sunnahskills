import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { PaymentsSummary } from "@/components/admin/PaymentsSummary";

const mockPayments = [
  {
    payment_id: 1,
    registration_id: 101,
    status: "paid",
    amount: 10000,
    currency: "usd",
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    payment_id: 2,
    registration_id: 102,
    status: "pending",
    amount: 5000,
    currency: "USD",
    created_at: "2026-03-16T14:30:00Z",
  },
];

describe("PaymentsSummary", () => {
  it("renders payments table header", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Registration")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
  });

  it("renders payment rows with correct data", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#101")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("formats currency correctly", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("$50")).toBeInTheDocument();
  });

  it("handles uppercase and lowercase currency codes", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getAllByText(/\$\d+/).length).toBe(2);
  });

  it("displays empty state when no payments", () => {
    render(<PaymentsSummary payments={[]} />);

    expect(screen.getByText(/no payments found/i)).toBeInTheDocument();
  });

  it("renders within PremiumCard", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    const card = screen.getByTestId("premium-card-root");
    expect(card).toBeInTheDocument();
  });
});
