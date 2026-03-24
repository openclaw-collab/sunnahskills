import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test-utils";
import { TelemetryCard } from "@/components/brand/TelemetryCard";

describe("TelemetryCard", () => {
  it("renders title, label, and children content", () => {
    render(
      <TelemetryCard
        title="Weekly Attendance"
        label="metric"
        icon={<span data-testid="telemetry-icon">📈</span>}
      >
        <div>42 students</div>
      </TelemetryCard>,
    );

    expect(
      screen.getByRole("heading", { name: "Weekly Attendance" }),
    ).toBeInTheDocument();

    expect(screen.getByText("metric")).toBeInTheDocument();
    expect(screen.getByTestId("telemetry-icon")).toBeInTheDocument();
    expect(screen.getByText("42 students")).toBeInTheDocument();
  });

  it("applies rounded, moss border, and mono label classes", () => {
    render(
      <TelemetryCard title="Telemetry" label="label" icon={<span>i</span>}>
        <span>content</span>
      </TelemetryCard>,
    );

    const card = screen.getByTestId("telemetry-card-root");
    const label = screen.getByTestId("telemetry-card-label");

    expect(card.className).toContain("rounded-[2rem]");
    expect(card.className).toMatch(/border-?moss/);
    expect(label.className).toMatch(/mono/i);
  });

  it("allows passing through additional className to the root", () => {
    render(
      <TelemetryCard title="Telemetry" label="label" className="custom-telemetry-class">
        <span>content</span>
      </TelemetryCard>,
    );

    const card = screen.getByTestId("telemetry-card-root");
    expect(card.className).toContain("custom-telemetry-class");
  });
});

