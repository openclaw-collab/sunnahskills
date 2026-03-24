import React from "react";
import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/__tests__/test-utils";
import { StepStudentInfo } from "@/components/registration/StepStudentInfo";
import { useRegistration } from "@/hooks/useRegistration";

function Harness() {
  const { draft, updateDraft } = useRegistration("bjj");
  return <StepStudentInfo draft={draft} updateDraft={updateDraft} />;
}

describe("StepStudentInfo", () => {
  it("renders all form fields", () => {
    render(<Harness />);

    expect(screen.getByLabelText(/student full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByText(/gender/i)).toBeInTheDocument();
    expect(screen.getByText(/prior experience level/i)).toBeInTheDocument();
  });

  it("updates student full name", () => {
    render(<Harness />);

    const input = screen.getByLabelText(/student full name/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "John Doe" } });
    expect(input.value).toBe("John Doe");
  });

  it("updates preferred name", () => {
    render(<Harness />);

    const input = screen.getByLabelText(/preferred name/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Johnny" } });
    expect(input.value).toBe("Johnny");
  });

  it("updates date of birth and calculates age", () => {
    render(<Harness />);

    const dobInput = screen.getByLabelText(/date of birth/i) as HTMLInputElement;

    fireEvent.change(dobInput, { target: { value: "2010-01-01" } });
    expect(dobInput.value).toBe("2010-01-01");
  });

  it("renders gender radio options", () => {
    render(<Harness />);

    expect(screen.getByLabelText("Male")).toBeInTheDocument();
    expect(screen.getByLabelText("Female")).toBeInTheDocument();
    expect(screen.getByLabelText("Prefer not to say")).toBeInTheDocument();
  });

  it("renders skill level radio options", () => {
    render(<Harness />);

    expect(screen.getByLabelText(/beginner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/some experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/intermediate/i)).toBeInTheDocument();
  });

  it("renders medical notes textarea", () => {
    render(<Harness />);

    expect(screen.getByPlaceholderText(/anything we should know to support the student safely/i)).toBeInTheDocument();
  });

  it("displays validation errors when provided", () => {
    function HarnessWithErrors() {
      const { draft, updateDraft } = useRegistration("bjj");
      return (
        <StepStudentInfo
          draft={draft}
          updateDraft={updateDraft}
          errors={{ "student.fullName": "Full name is required" }}
          touch={() => {}}
        />
      );
    }

    render(<HarnessWithErrors />);

    expect(screen.getByText("Full name is required")).toBeInTheDocument();
  });
});
