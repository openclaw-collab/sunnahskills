import React from "react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/__tests__/test-utils";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { DEFAULT_ADMIN_FILTERS, type AdminFilterState } from "@/components/admin/adminFilterOptions";

describe("AdminFilterBar", () => {
  it("emits search filter changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function Harness() {
      const [filters, setFilters] = React.useState<AdminFilterState>(DEFAULT_ADMIN_FILTERS);
      return (
        <AdminFilterBar
          value={filters}
          programs={[{ id: "bjj", name: "Brazilian Jiu-Jitsu", slug: "bjj" }]}
          locations={[{ id: "oakville", display_name: "Oakville" }]}
          tracks={[{ value: "boys-7-13", label: "Boys 7-13" }]}
          mode="registrations"
          onChange={(next) => {
            setFilters(next);
            onChange(next);
          }}
          onRefresh={() => undefined}
          refreshing={false}
        />
      );
    }

    render(<Harness />);

    await user.type(screen.getByPlaceholderText(/parent, student, email, order/i), "hassan");

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ q: "hassan" }));
  });
});
