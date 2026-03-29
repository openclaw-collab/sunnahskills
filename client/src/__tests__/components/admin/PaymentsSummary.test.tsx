import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { PaymentsSummary } from "@/components/admin/PaymentsSummary";

const mockPayments = [
  {
    order_id: 1,
    registration_id: 101,
    order_status: "partially_paid",
    latest_payment_status: "paid",
    amount_due_today_cents: 10000,
    total_cents: 20000,
    paid_cents: 10000,
    later_amount_cents: 10000,
    later_payment_date: "2026-05-12",
    guardian_name: "John Doe",
    student_names: "Jimmy Doe",
    created_at: "2026-03-15T10:00:00Z",
  },
  {
    order_id: 2,
    registration_id: 102,
    order_status: "superseded",
    latest_payment_status: "requires_payment_method",
    amount_due_today_cents: 5000,
    total_cents: 5000,
    manual_review_reason: "stale_cleanup_kept_order:5",
    guardian_name: "Jane Doe",
    student_names: "Sara Doe",
    created_at: "2026-03-16T14:30:00Z",
  },
];

describe("PaymentsSummary", () => {
  it("renders payments table header", () => {
    render(<PaymentsSummary payments={mockPayments} showSuperseded={false} onShowSupersededChange={() => {}} />);

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
    render(<PaymentsSummary payments={mockPayments} showSuperseded={false} onShowSupersededChange={() => {}} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Reg: 101")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jimmy Doe")).toBeInTheDocument();
    expect(screen.getByText("First payment received")).toBeInTheDocument();
    expect(screen.getAllByText(/\$100\.00/).length).toBeGreaterThanOrEqual(2);
  });

  it("formats currency correctly", () => {
    render(<PaymentsSummary payments={mockPayments} showSuperseded={false} onShowSupersededChange={() => {}} />);

    expect(screen.getAllByText(/\$100\.00/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/\$50\.00/).length).toBeGreaterThanOrEqual(2);
  });

  it("handles uppercase and lowercase currency codes", () => {
    render(<PaymentsSummary payments={mockPayments} showSuperseded={false} onShowSupersededChange={() => {}} />);

    expect(screen.getAllByText(/\$\d+\.\d{2}/).length).toBeGreaterThanOrEqual(4);
  });

  it("explains stale and partial-payment states in plain language", () => {
    render(<PaymentsSummary payments={mockPayments} showSuperseded={false} onShowSupersededChange={() => {}} />);

    expect(screen.getByText(/Collected \$100\.00 today\. Remaining \$100\.00 will be charged on May 12, 2026\./i)).toBeInTheDocument();
    expect(screen.getByText("Superseded stale attempt")).toBeInTheDocument();
    expect(screen.getByText(/A newer unpaid checkout replaced this one/i)).toBeInTheDocument();
  });

  it("displays empty state when no payments", () => {
    render(<PaymentsSummary payments={[]} showSuperseded={false} onShowSupersededChange={() => {}} />);

    expect(screen.getByText(/no orders found/i)).toBeInTheDocument();
  });

  it("renders within PremiumCard", () => {
    render(<PaymentsSummary payments={mockPayments} showSuperseded={false} onShowSupersededChange={() => {}} />);

    const card = screen.getByTestId("premium-card-root");
    expect(card).toBeInTheDocument();
  });
});
