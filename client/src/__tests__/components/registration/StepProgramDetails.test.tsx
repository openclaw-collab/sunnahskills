import React from "react";
import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
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

describe("StepProgramDetails", () => {
  describe("BJJ program", () => {
    it("renders BJJ-specific fields", () => {
      render(<BjjHarness />);

      expect(screen.getByText(/class group/i)).toBeInTheDocument();
      expect(screen.getByText(/age group/i)).toBeInTheDocument();
      expect(screen.getByText(/Would you like to start with a trial class/i)).toBeInTheDocument();
    });

    it("renders gender class options", () => {
      render(<BjjHarness />);

      expect(screen.getByLabelText(/boys' class/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/girls' class/i)).toBeInTheDocument();
    });

    it("renders age group options", () => {
      render(<BjjHarness />);

      expect(screen.getByLabelText(/6–10 yrs/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/11–14 yrs/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/15–17 yrs/i)).toBeInTheDocument();
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
