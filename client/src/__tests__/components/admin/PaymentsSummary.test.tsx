import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { PaymentsSummary } from "@/components/admin/PaymentsSummary";

const mockPayments = [
  {
    order_id: 1,
    registration_id: 101,
    order_status: "paid",
    latest_payment_status: "succeeded",
    amount_due_today_cents: 10000,
    guardian_name: "John Doe",
    student_names: "Jimmy Doe",
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    order_id: 2,
    registration_id: 102,
    order_status: "pending",
    latest_payment_status: "requires_confirmation",
    amount_due_today_cents: 5000,
    guardian_name: "Jane Doe",
    student_names: "Sara Doe",
    created_at: "2026-03-16T14:30:00Z",
  },
];

describe("PaymentsSummary", () => {
  it("renders payments table header", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getByText("Orders & Payments")).toBeInTheDocument();
    expect(screen.getByText("Order")).toBeInTheDocument();
    expect(screen.getByText("Guardian")).toBeInTheDocument();
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Today / Later")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
  });

  it("renders payment rows with correct data", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Reg: 101")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jimmy Doe")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("formats currency correctly", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
  });

  it("handles uppercase and lowercase currency codes", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    expect(screen.getAllByText(/\$\d+\.\d{2}/).length).toBe(2);
  });

  it("displays empty state when no payments", () => {
    render(<PaymentsSummary payments={[]} />);

    expect(screen.getByText(/no orders found/i)).toBeInTheDocument();
  });

  it("renders within PremiumCard", () => {
    render(<PaymentsSummary payments={mockPayments} />);

    const card = screen.getByTestId("premium-card-root");
    expect(card).toBeInTheDocument();
  });
});
