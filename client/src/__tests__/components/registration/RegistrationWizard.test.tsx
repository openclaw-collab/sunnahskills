import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@/__tests__/test-utils";
import { RegistrationWizard } from "@/components/registration/RegistrationWizard";
import { PROGRAMS } from "@/lib/programConfig";

describe("RegistrationWizard", () => {
  it("renders step header and summary sidebar", () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();

    render(
      <RegistrationWizard
        program={PROGRAMS.bjj}
        steps={[
          { id: "guardian", label: "Guardian" },
          { id: "student", label: "Student" },
        ]}
        currentStepIndex={0}
        onBack={onBack}
        onNext={onNext}
        onSubmit={onSubmit}
        renderStep={() => <div>Step content</div>}
      />,
    );

    expect(screen.getByText("Brazilian Jiu-Jitsu")).toBeInTheDocument();
    expect(screen.getByText("Step 1 / 2: Guardian")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("What happens next")).toBeInTheDocument();
    expect(screen.getByText("Step content")).toBeInTheDocument();
  });

  it("calls onNext or onSubmit depending on step index", async () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();

    render(
      <RegistrationWizard
        program={PROGRAMS.archery}
        steps={[
          { id: "guardian", label: "Guardian" },
          { id: "payment", label: "Payment" },
        ]}
        currentStepIndex={0}
        onBack={onBack}
        onNext={onNext}
        onSubmit={onSubmit}
        renderStep={() => <div />}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onNext).toHaveBeenCalledTimes(1);

    render(
      <RegistrationWizard
        program={PROGRAMS.archery}
        steps={[
          { id: "guardian", label: "Guardian" },
          { id: "payment", label: "Payment" },
        ]}
        currentStepIndex={1}
        onBack={onBack}
        onNext={onNext}
        onSubmit={onSubmit}
        renderStep={() => <div />}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /complete payment/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

