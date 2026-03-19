import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { ProgramSummaryCard } from "@/components/registration/ProgramSummaryCard";
import { PROGRAMS } from "@/lib/programConfig";

describe("ProgramSummaryCard", () => {
  it("renders program name in TelemetryCard", () => {
    render(
      <ProgramSummaryCard program={PROGRAMS.bjj} />
    );

    expect(screen.getByRole("heading", { name: "Brazilian Jiu-Jitsu" })).toBeInTheDocument();
    expect(screen.getByText("selected program")).toBeInTheDocument();
  });

  it("displays program age range", () => {
    render(
      <ProgramSummaryCard program={PROGRAMS.bjj} />
    );

    expect(screen.getByText("Age range")).toBeInTheDocument();
    expect(screen.getByText("Youth + Teen Tracks")).toBeInTheDocument();
  });

  it("displays program schedule", () => {
    render(
      <ProgramSummaryCard program={PROGRAMS.bjj} />
    );

    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Recurring weekly sessions with age-group tracks.")).toBeInTheDocument();
  });

  it("displays program pricing", () => {
    render(
      <ProgramSummaryCard program={PROGRAMS.bjj} />
    );

    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Monthly tuition + optional one-time registration fee (admin-editable).")).toBeInTheDocument();
  });

  it("uses selected session label when provided", () => {
    render(
      <ProgramSummaryCard
        program={PROGRAMS.bjj}
        selected={{ sessionLabel: "Custom Session", priceLabel: "Custom Price" }}
      />
    );

    expect(screen.getByText("Custom Session")).toBeInTheDocument();
    expect(screen.getByText("Custom Price")).toBeInTheDocument();
  });

  it("works with different programs", () => {
    const { rerender } = render(
      <ProgramSummaryCard program={PROGRAMS.archery} />
    );

    expect(screen.getByRole("heading", { name: "Traditional Archery" })).toBeInTheDocument();

    rerender(<ProgramSummaryCard program={PROGRAMS.outdoor} />);
    expect(screen.getByRole("heading", { name: "Outdoor Workshops" })).toBeInTheDocument();

    rerender(<ProgramSummaryCard program={PROGRAMS.bullyproofing} />);
    expect(screen.getByRole("heading", { name: "Bullyproofing Workshops" })).toBeInTheDocument();
  });

  it("renders within TelemetryCard structure", () => {
    render(
      <ProgramSummaryCard program={PROGRAMS.bjj} />
    );

    const card = screen.getByTestId("telemetry-card-root");
    expect(card).toBeInTheDocument();
  });
});
