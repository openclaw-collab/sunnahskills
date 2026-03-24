import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
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
            payment_status: "unpaid",
            payment_amount: null,
          },
        ]}
        onOpen={onOpen}
      />,
    );

    expect(await screen.findByText("Registrations")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Student One"));
    expect(onOpen).toHaveBeenCalledWith(123);
  });
});

