import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { RegistrationDetail } from "@/components/admin/RegistrationDetail";

describe("RegistrationDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and renders registration detail and saves changes", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({
          registration: {
            id: 55,
            status: "submitted",
            admin_notes: "",
            program_name: "Archery",
            student_full_name: "Student A",
            guardian_full_name: "Parent A",
            guardian_email: "a@example.com",
            guardian_phone: "555",
            payment_status: "paid",
            payment_amount: 15600,
            payment_currency: "cad",
            order_id: 21,
            order_status: "partially_paid",
            order_total_cents: 31200,
            order_amount_due_today_cents: 15600,
            order_later_amount_cents: 15600,
            order_later_payment_date: "2026-05-12",
          },
        }),
      }))
      .mockImplementationOnce(async () => ({ ok: true, json: async () => ({ ok: true }) }));

    (globalThis as any).fetch = fetchMock;

    const onUpdated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RegistrationDetail
        registrationId={55}
        open
        onOpenChange={onOpenChange}
        onUpdated={onUpdated}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: /Student A • Archery • #55/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Half paid/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining \$156\.00 will be charged on May 12, 2026\./i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(fetchMock).toHaveBeenLastCalledWith("/api/admin/registrations/55", expect.objectContaining({ method: "PATCH" }));
  });
});
