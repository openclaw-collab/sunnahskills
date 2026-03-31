import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { AdminOverview } from "@/components/admin/AdminOverview";

const mockRegistrations = [
  {
    registration_id: 1,
    registration_status: "active",
    program_name: "BJJ",
    payment_status: "paid",
    payment_amount: 10000,
  },
  {
    registration_id: 2,
    registration_status: "pending_payment",
    program_name: "Archery",
    payment_status: null,
    payment_amount: null,
  },
];

const mockPayments = [
  { payment_id: 1, status: "paid", amount: 10000, currency: "CAD" },
  { payment_id: 2, status: "pending", amount: 5000, currency: "CAD" },
];

describe("AdminOverview", () => {
  it("renders statistics cards", () => {
    render(
      <AdminOverview registrations={mockRegistrations} payments={mockPayments} />
    );

    expect(screen.getByText("Registrations")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
  });

  it("displays correct counts", () => {
    render(
      <AdminOverview registrations={mockRegistrations} payments={mockPayments} />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    // Multiple TelemetryCards may show "1" (paidRegs=1, activeRegs=1)
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("displays revenue in correct format", () => {
    render(
      <AdminOverview registrations={mockRegistrations} payments={mockPayments} />
    );

    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("renders snapshot section", () => {
    render(
      <AdminOverview registrations={mockRegistrations} payments={mockPayments} />
    );

    expect(screen.getByText("Snapshot")).toBeInTheDocument();
    expect(screen.getByText("Most recent registration")).toBeInTheDocument();
    expect(screen.getByText("Most recent payment")).toBeInTheDocument();
    expect(screen.getByText("Quick reminder")).toBeInTheDocument();
  });

  it("displays most recent registration info", () => {
    render(
      <AdminOverview registrations={mockRegistrations} payments={mockPayments} />
    );

    expect(screen.getByText(/BJJ • #1/)).toBeInTheDocument();
  });

  it("displays most recent payment info", () => {
    render(
      <AdminOverview registrations={mockRegistrations} payments={mockPayments} />
    );

    expect(screen.getByText(/paid • \$100\.00/)).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    render(<AdminOverview registrations={[]} payments={[]} />);

    expect(screen.getByText("Registrations")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("displays webhook reminder", () => {
    render(
      <AdminOverview registrations={mockRegistrations} payments={mockPayments} />
    );

    expect(screen.getByText(/Payment statuses update automatically/i)).toBeInTheDocument();
  });
});
