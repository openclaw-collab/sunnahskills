import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@/__tests__/test-utils";
import { StepProgramDetails } from "@/components/registration/StepProgramDetails";
import { useRegistration } from "@/hooks/useRegistration";

function BjjHarness() {
  const { draft, updateDraft } = useRegistration("bjj");
  return <StepProgramDetails draft={draft} updateDraft={updateDraft} />;
}

function ArcheryHarness() {
  const { draft, updateDraft } = useRegistration("archery");
  return <StepProgramDetails draft={draft} updateDraft={updateDraft} />;
}

function OutdoorHarness() {
  const { draft, updateDraft } = useRegistration("outdoor");
  return <StepProgramDetails draft={draft} updateDraft={updateDraft} />;
}

function BullyproofingHarness() {
  const { draft, updateDraft } = useRegistration("bullyproofing");
  return <StepProgramDetails draft={draft} updateDraft={updateDraft} />;
}

const MOCK_PROGRAMS_CATALOG = {
  programs: [
    {
      id: "bjj",
      slug: "bjj",
      name: "Brazilian Jiu-Jitsu",
      status: "active",
      sessions: [
        {
          id: 1,
          program_id: "bjj",
          name: "Boys Fri",
          day_of_week: "Friday",
          start_time: "10:00",
          end_time: "11:00",
          age_group: "boys-7-13",
          gender_group: "male",
          capacity: 20,
        },
        {
          id: 2,
          program_id: "bjj",
          name: "Boys Tue",
          day_of_week: "Tuesday",
          start_time: "14:30",
          end_time: "15:30",
          age_group: "boys-7-13",
          gender_group: "male",
          capacity: 20,
        },
        {
          id: 20,
          program_id: "bjj",
          name: "Girls Fri",
          day_of_week: "Friday",
          start_time: "10:00",
          end_time: "11:00",
          age_group: "girls-5-10",
          gender_group: "female",
          capacity: 20,
        },
        {
          id: 21,
          program_id: "bjj",
          name: "Women Tue",
          day_of_week: "Tuesday",
          start_time: "12:30",
          end_time: "14:00",
          age_group: "women-11-tue",
          gender_group: "female",
          capacity: 20,
        },
        {
          id: 22,
          program_id: "bjj",
          name: "Women Thu",
          day_of_week: "Thursday",
          start_time: "08:00",
          end_time: "09:30",
          age_group: "women-11-thu",
          gender_group: "female",
          capacity: 20,
        },
        {
          id: 30,
          program_id: "bjj",
          name: "Men Fri",
          day_of_week: "Friday",
          start_time: "08:00",
          end_time: "09:00",
          age_group: "men-14",
          gender_group: "male",
          capacity: 20,
        },
        {
          id: 31,
          program_id: "bjj",
          name: "Men Sat",
          day_of_week: "Saturday",
          start_time: "08:00",
          end_time: "09:00",
          age_group: "men-14",
          gender_group: "male",
          capacity: 20,
        },
      ],
      prices: [
        { id: 101, program_id: "bjj", age_group: "boys-7-13", label: "Boys", amount: 1250, frequency: "per_session", registration_fee: 2500, metadata: "{}" },
        { id: 102, program_id: "bjj", age_group: "girls-5-10", label: "Girls", amount: 1250, frequency: "per_session", registration_fee: 2500, metadata: "{}" },
        { id: 103, program_id: "bjj", age_group: "women-11-tue", label: "W Tue", amount: 5000, frequency: "per_session", registration_fee: 0, metadata: "{}" },
        { id: 104, program_id: "bjj", age_group: "women-11-thu", label: "W Thu", amount: 5000, frequency: "per_session", registration_fee: 0, metadata: "{}" },
        { id: 105, program_id: "bjj", age_group: "men-14", label: "Men", amount: 5000, frequency: "per_session", registration_fee: 0, metadata: "{}" },
      ],
      active_semester: {
        id: 1,
        name: "Spring 2026",
        program_id: "bjj",
        start_date: "2026-01-01",
        end_date: "2026-06-30",
        classes_in_semester: 12,
        price_per_class_cents: 1250,
        registration_fee_cents: 2500,
        later_payment_date: null,
        active: 1,
      },
    },
  ],
};

describe("StepProgramDetails", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/programs")) {
        return new Response(JSON.stringify(MOCK_PROGRAMS_CATALOG), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("BJJ program", () => {
    it("renders BJJ-specific fields", async () => {
      render(<BjjHarness />);

      await waitFor(() => {
        expect(screen.queryByText(/loading class schedule/i)).not.toBeInTheDocument();
      });
      expect(screen.getByText(/class track/i)).toBeInTheDocument();
      expect(screen.getByText(/Would you like to start with a trial class/i)).toBeInTheDocument();
    });

    it("renders track options including kids and teen tracks", async () => {
      render(<BjjHarness />);
      await waitFor(() => {
        expect(screen.queryByText(/loading class schedule/i)).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Girls 5–10/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Boys 7–13/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teens\+ Men 14\+/i)).toBeInTheDocument();
    });

    it("shows women Tuesday and Thursday as separate tracks", async () => {
      render(<BjjHarness />);
      await waitFor(() => {
        expect(screen.queryByText(/loading class schedule/i)).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Teens\+ Women 11\+ Tuesday/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teens\+ Women 11\+ Thursday/i)).toBeInTheDocument();
    });
  });

  describe("Archery program", () => {
    it("renders archery-specific fields", () => {
      render(<ArcheryHarness />);

      expect(screen.getByText(/dominant hand/i)).toBeInTheDocument();
      expect(screen.getByText(/prior archery experience/i)).toBeInTheDocument();
      expect(screen.getByText(/preferred session/i)).toBeInTheDocument();
    });

    it("renders hand options", () => {
      render(<ArcheryHarness />);

      expect(screen.getByLabelText(/right-handed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/left-handed/i)).toBeInTheDocument();
    });
  });

  describe("Outdoor program", () => {
    it("renders outdoor-specific fields", () => {
      render(<OutdoorHarness />);

      expect(screen.getByText(/workshop date/i)).toBeInTheDocument();
      expect(screen.getByText(/gear checklist/i)).toBeInTheDocument();
    });

    it("renders gear options", () => {
      render(<OutdoorHarness />);

      expect(screen.getByLabelText(/sturdy, closed-toe boots/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rain gear/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/water bottle/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sun protection/i)).toBeInTheDocument();
    });
  });

  describe("Bullyproofing program", () => {
    it("renders bullyproofing-specific fields", () => {
      render(<BullyproofingHarness />);

      expect(screen.getByText(/primary concern/i)).toBeInTheDocument();
      expect(screen.getByText(/student age group/i)).toBeInTheDocument();
    });

    it("renders concern type options", () => {
      render(<BullyproofingHarness />);

      expect(screen.getByLabelText(/being bullied/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/exhibiting bullying behaviour/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/general confidence building/i)).toBeInTheDocument();
    });
  });

  describe("Sibling discount", () => {
    it("renders sibling discount options for all programs", () => {
      const { rerender } = render(<BjjHarness />);
      expect(screen.getByText(/registering siblings/i)).toBeInTheDocument();

      rerender(<ArcheryHarness />);
      expect(screen.getByText(/registering siblings/i)).toBeInTheDocument();

      rerender(<OutdoorHarness />);
      expect(screen.getByText(/registering siblings/i)).toBeInTheDocument();

      rerender(<BullyproofingHarness />);
      expect(screen.getByText(/registering siblings/i)).toBeInTheDocument();
    });

    it("renders sibling count options", () => {
      render(<BjjHarness />);

      expect(screen.getByLabelText(/no siblings/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/1 sibling/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/2\+ siblings/i)).toBeInTheDocument();
    });
  });
});
