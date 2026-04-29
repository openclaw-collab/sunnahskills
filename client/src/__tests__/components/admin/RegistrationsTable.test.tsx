import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";

describe("RegistrationsTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("opens detail when row clicked", async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ programs: [] }),
    }));

    const onOpen = vi.fn();
    render(
      <RegistrationsTable
        initial={[
          {
            registration_id: 123,
            registration_status: "submitted",
            created_at: "2026-01-01",
            program_name: "Brazilian Jiu-Jitsu",
            program_slug: "bjj",
            guardian_name: "Parent One",
            guardian_email: "p@example.com",
            student_name: "Student One",
            payment_status: "failed",
            payment_amount: 10000,
            order_status: "superseded",
            order_manual_review_reason: "stale_cleanup_kept_order:33",
            order_total_cents: 10000,
            order_amount_due_today_cents: 10000,
            order_later_amount_cents: 0,
            order_later_payment_date: null,
          },
        ]}
        showSuperseded={false}
        onShowSupersededChange={vi.fn()}
        onOpen={onOpen}
      />,
    );

    expect(await screen.findByText("Registrations")).toBeInTheDocument();
    expect(screen.getAllByText("Superseded").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Replaced by a newer checkout/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Student One"));
    expect(onOpen).toHaveBeenCalledWith(123);
  });

  it("builds the refresh query from filters and superseded toggle", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({ programs: [{ id: "bjj", slug: "bjj", name: "Brazilian Jiu-Jitsu" }] }),
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({ locations: [{ id: "oakville", display_name: "Oakville" }] }),
      }))
      .mockImplementationOnce(async () => ({
        ok: true,
        json: async () => ({ registrations: [] }),
      }));

    (globalThis as any).fetch = fetchMock;

    function Harness() {
      const [showSuperseded, setShowSuperseded] = React.useState(false);
      return (
        <RegistrationsTable
          initial={[]}
          showSuperseded={showSuperseded}
          onShowSupersededChange={setShowSuperseded}
          onOpen={vi.fn()}
        />
      );
    }

    render(<Harness />);

    expect(await screen.findByText("Registrations")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/parent, student, email, order/i), "student one");
    await user.click(screen.getByLabelText(/show superseded/i));
    await user.click(screen.getByRole("button", { name: /refresh/i }));

    const lastCall = fetchMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toContain("/api/admin/registrations?");
    expect(lastCall).toContain("q=student+one");
    expect(lastCall).toContain("includeSuperseded=1");
  });
});
