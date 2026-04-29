import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Router } from "wouter";
import { render } from "@/__tests__/test-utils";
import RegistrationHub from "@/pages/RegistrationHub";

vi.mock("@/hooks/useGuardianSession", () => ({
  useGuardianSession: () => ({
    data: {
      authenticated: true,
      accountComplete: true,
      fullName: "Parent One",
      phone: "555-555-5555",
      emergencyContactName: "Backup Parent",
      emergencyContactPhone: "555-555-5556",
      accountRole: "parent_guardian",
    },
    isLoading: false,
  }),
  useGuardianStudents: () => ({
    data: {
      students: [
        {
          id: 1,
          full_name: "Student One",
          date_of_birth: "2016-01-01",
          gender: "male",
          medical_notes: null,
        },
      ],
    },
    isLoading: false,
  }),
}));

function renderHub() {
  function useTestLocation() {
    return ["/register", () => undefined] as [string, (to: string) => void];
  }

  return render(
    <Router hook={useTestLocation}>
      <RegistrationHub />
    </Router>,
  );
}

describe("RegistrationHub program cards", () => {
  beforeEach(() => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ fees: [] }),
    }));
  });

  it("shows clean program cards without explanatory undertext", async () => {
    renderHub();

    expect(await screen.findByText("Brazilian Jiu-Jitsu")).toBeInTheDocument();
    expect(screen.getByText("Traditional Archery")).toBeInTheDocument();
    expect(screen.queryByText(/Age and gender tracks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Four-session series/i)).not.toBeInTheDocument();
  });
});
