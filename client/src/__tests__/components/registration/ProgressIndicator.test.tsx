import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { ProgressIndicator, type ProgressStep } from "@/components/registration/ProgressIndicator";

const TEST_STEPS: ProgressStep[] = [
  { id: "guardian", label: "Guardian" },
  { id: "student", label: "Student" },
  { id: "details", label: "Details" },
  { id: "waivers", label: "Waivers" },
  { id: "payment", label: "Payment" },
];

describe("ProgressIndicator", () => {
  it("renders all step labels", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={0} />
    );

    TEST_STEPS.forEach(step => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    });
  });

  it("marks current step with active styling", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={2} />
    );

    const activeStep = screen.getByText("Details");
    expect(activeStep.className).toMatch(/text-charcoal/);
  });

  it("marks completed steps with moss color", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={2} />
    );

    const completedStep = screen.getByText("Guardian");
    expect(completedStep.className).toMatch(/text-moss/);
  });

  it("marks future steps with muted styling", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={2} />
    );

    const futureStep = screen.getByText("Payment");
    expect(futureStep.className).toMatch(/text-charcoal\/50/);
  });

  it("renders StatusDot for active step", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={1} />
    );

    const statusDot = screen.getByTestId("status-dot");
    expect(statusDot).toBeInTheDocument();
  });

  it("does not render StatusDot when on first step", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={0} />
    );

    const statusDots = screen.queryAllByTestId("status-dot");
    expect(statusDots.length).toBe(1);
  });

  it("applies custom className to container", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={0} className="custom-progress-class" />
    );

    const container = screen.getByText("Guardian").closest(".flex");
    expect(container?.parentElement?.className).toContain("custom-progress-class");
  });

  it("renders step indicators as circles", () => {
    render(
      <ProgressIndicator steps={TEST_STEPS} currentStepIndex={0} />
    );

    const stepLabels = screen.getAllByText(/Guardian|Student|Details|Waivers|Payment/);
    expect(stepLabels).toHaveLength(5);
  });
});
