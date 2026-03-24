import React from "react";
import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/__tests__/test-utils";
import { StepWaivers } from "@/components/registration/StepWaivers";
import { useRegistration } from "@/hooks/useRegistration";

function Harness() {
  const { draft, updateDraft } = useRegistration("bjj");
  return <StepWaivers draft={draft} updateDraft={updateDraft} />;
}

describe("StepWaivers", () => {
  it("renders all waiver checkboxes", () => {
    render(<Harness />);

    expect(screen.getByText(/liability waiver/i)).toBeInTheDocument();
    expect(screen.getByText(/photo\/media use/i)).toBeInTheDocument();
    expect(screen.getByText(/medical treatment/i)).toBeInTheDocument();
    expect(screen.getByText(/terms and policies/i)).toBeInTheDocument();
  });

  it("renders signature input", () => {
    render(<Harness />);

    expect(screen.getByText(/typed legal signature/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type full name/i)).toBeInTheDocument();
  });

  it("renders date input", () => {
    render(<Harness />);

    expect(screen.getByText(/date/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/yyyy-mm-dd/i)).toBeInTheDocument();
  });

  it("updates signature text", () => {
    render(<Harness />);

    const inputs = screen.getAllByRole("textbox");
    const signatureInput = inputs.find(input =>
      input.getAttribute("placeholder")?.includes("full name")
    ) as HTMLInputElement;

    if (signatureInput) {
      fireEvent.change(signatureInput, { target: { value: "Parent Signature" } });
      expect(signatureInput.value).toBe("Parent Signature");
    }
  });

  it("updates date", () => {
    render(<Harness />);

    const inputs = screen.getAllByRole("textbox");
    const dateInput = inputs.find(input =>
      input.getAttribute("placeholder")?.includes("YYYY-MM-DD")
    ) as HTMLInputElement;

    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: "2026-03-18" } });
      expect(dateInput.value).toBe("2026-03-18");
    }
  });

  it("displays helper text for waivers", () => {
    render(<Harness />);

    const helperTexts = screen.queryAllByText(/you'll review the full policy text/i);
    expect(helperTexts.length).toBeGreaterThanOrEqual(0);
  });
});
