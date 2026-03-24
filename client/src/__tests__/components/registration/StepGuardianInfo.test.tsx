import React from "react";
import { describe, expect, it } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/__tests__/test-utils";
import { StepGuardianInfo } from "@/components/registration/StepGuardianInfo";
import { useRegistration } from "@/hooks/useRegistration";

function Harness() {
  const { draft, updateDraft } = useRegistration("bjj");
  return <StepGuardianInfo draft={draft} updateDraft={updateDraft} />;
}

describe("StepGuardianInfo", () => {
  it("updates guardian full name", () => {
    render(<Harness />);
    const input = screen.getByLabelText(/full name/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Parent Name" } });
    expect(input.value).toBe("Parent Name");
  });
});

