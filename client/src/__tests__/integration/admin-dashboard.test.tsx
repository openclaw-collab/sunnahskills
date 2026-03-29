import React, { useCallback, useState } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { render } from "./test-utils";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { mockStore } from "./mocks/handlers";

function renderDashboardAt(path = "/admin/dashboard") {
  function useDashboardLocation(_router: unknown) {
    const [loc, setLoc] = useState(path);
    const nav = useCallback((to: string) => {
      setLoc(to);
    }, []);
    return [loc, nav] as [string, (to: string) => void];
  }

  return render(
    <Router hook={useDashboardLocation}>
      <AdminDashboard />
    </Router>,
  );
}

describe("Admin dashboard integration", () => {
  beforeEach(() => {
    mockStore.currentUser = {
      email: "muadh@sunnahskills.com",
      name: "Admin User",
      role: "admin",
    };
    mockStore.registrations = [
      {
        id: 55,
        registration_id: 55,
        program_slug: "bjj",
        program_name: "Brazilian Jiu-Jitsu",
        guardian_name: "Parent A",
        guardian_email: "parent@example.com",
        student_name: "Student A",
        registration_status: "pending_payment",
        payment_status: "failed",
        payment_amount: 0,
        order_status: "superseded",
        order_manual_review_reason: "stale_cleanup_kept_order:33",
        order_total_cents: 44460,
        order_amount_due_today_cents: 44460,
        order_later_amount_cents: 0,
        order_later_payment_date: null,
        created_at: new Date().toISOString(),
      },
    ];
    mockStore.payments = [
      {
        order_id: 21,
        registration_id: 55,
        order_status: "partially_paid",
        latest_payment_status: "paid",
        amount_due_today_cents: 15600,
        total_cents: 31200,
        paid_cents: 15600,
        later_amount_cents: 15600,
        later_payment_date: "2026-05-12",
        guardian_name: "Parent A",
        student_names: "Student A",
        created_at: new Date().toISOString(),
      },
    ];
  });

  it("switches through the admin panels", async () => {
    const user = userEvent.setup();
    renderDashboardAt("/admin/dashboard");

    expect(await screen.findByRole("tab", { name: /overview/i })).toBeInTheDocument();

    const panels: Array<[string, string]> = [
      ["overview", "admin-overview-panel"],
      ["registrations", "admin-registrations-panel"],
      ["trials", "admin-trials-panel"],
      ["payments", "admin-payments-panel"],
      ["discounts", "admin-discounts-panel"],
      ["pricing", "admin-pricing-panel"],
      ["sessions", "admin-sessions-panel"],
      ["contacts", "admin-contacts-panel"],
      ["export", "admin-export-panel"],
    ];

    for (const [tabName, panelTestId] of panels) {
      await user.click(screen.getByRole("tab", { name: new RegExp(`^${tabName}$`, "i") }));
      expect(await screen.findByTestId(panelTestId)).toBeInTheDocument();
    }
  });

  it("opens and closes a registration detail modal from the dashboard", async () => {
    const user = userEvent.setup();
    renderDashboardAt("/admin/dashboard/registrations");

    expect(await screen.findByRole("tab", { name: /registrations/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /registrations/i }));
    await waitFor(() => {
      expect(screen.getByText("Student A")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Student A"));

    const dialog = await screen.findByTestId("admin-registration-detail-dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Registration overview/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Family & student/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Payment detail/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/^Superseded$/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/A newer unpaid checkout replaced this one/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /close/i })[0]);

    await waitFor(() => {
      expect(screen.queryByTestId("admin-registration-detail-dialog")).not.toBeInTheDocument();
    });
  });
});
