import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { RegistrationDetail } from "@/components/admin/RegistrationDetail";

describe("RegistrationDetail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockDetailResponse(registration: Record<string, any>) {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({ registration }),
      }))
      .mockImplementationOnce(async () => ({ ok: true, json: async () => ({ ok: true }) }));

    (globalThis as any).fetch = fetchMock;
    return fetchMock;
  }

  it("loads and renders registration detail", async () => {
    mockDetailResponse({
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
    });

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
    expect(screen.getByTestId("admin-registration-detail-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Registration overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Family & student/i)).toBeInTheDocument();
    expect(screen.getByText(/Payment detail/i)).toBeInTheDocument();
    expect(screen.getByText(/^Waivers$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Admin notes$/i)).toBeInTheDocument();
    expect(await screen.findByText(/Half paid/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining \$156\.00 will be charged on May 12, 2026\./i)).toBeInTheDocument();
  });

  it("renders a paid-in-full registration with no later balance and closes cleanly", async () => {
    mockDetailResponse({
      id: 88,
      status: "active",
      admin_notes: "Ready for pickup",
      program_name: "Brazilian Jiu-Jitsu",
      student_full_name: "Student B",
      guardian_full_name: "Parent B",
      guardian_email: "b@example.com",
      guardian_phone: "777",
      payment_status: "paid",
      payment_amount: 33800,
      payment_currency: "cad",
      order_id: 22,
      order_status: "paid",
      order_total_cents: 33800,
      order_amount_due_today_cents: 33800,
      order_later_amount_cents: 0,
      order_later_payment_date: null,
    });

    const onUpdated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RegistrationDetail
        registrationId={88}
        open
        onOpenChange={onOpenChange}
        onUpdated={onUpdated}
      />,
    );

    expect(await screen.findByRole("heading", { name: /Student B • Brazilian Jiu-Jitsu • #88/i })).toBeInTheDocument();
    expect(screen.getByText(/Paid in full/i)).toBeInTheDocument();
    expect(screen.getByText(/^No later balance$/i)).toBeInTheDocument();
    expect(screen.getByText(/#22 · paid/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready for pickup/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /close/i })[0]);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders a failed registration with review details", async () => {
    mockDetailResponse({
      id: 99,
      status: "cancelled",
      admin_notes: "",
      program_name: "Archery",
      student_full_name: "Student C",
      guardian_full_name: "Parent C",
      guardian_email: "c@example.com",
      guardian_phone: "999",
      payment_status: "failed",
      payment_amount: 0,
      payment_currency: "cad",
      order_id: 33,
      order_status: "superseded",
      order_manual_review_status: "required",
      order_manual_review_reason: "stale_cleanup_kept_order:33",
      order_last_payment_error: "card_declined",
      order_total_cents: 44460,
      order_amount_due_today_cents: 44460,
      order_later_amount_cents: 0,
      order_later_payment_date: null,
    });

    const onUpdated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <RegistrationDetail
        registrationId={99}
        open
        onOpenChange={onOpenChange}
        onUpdated={onUpdated}
      />,
    );

    expect(await screen.findByRole("heading", { name: /Student C • Archery • #99/i })).toBeInTheDocument();
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/stale_cleanup_kept_order:33/i)).toBeInTheDocument();
    expect(screen.getByText(/Needs manual review/i)).toBeInTheDocument();
  });
});
