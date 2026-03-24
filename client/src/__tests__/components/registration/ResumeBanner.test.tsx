import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { ResumeBanner } from "@/components/registration/ResumeBanner";

describe("ResumeBanner", () => {
  it("renders saved draft message with program name", () => {
    render(
      <ResumeBanner
        programName="Brazilian Jiu-Jitsu"
        onResume={() => {}}
        onStartFresh={() => {}}
      />,
    );

    expect(screen.getByText("Saved draft")).toBeInTheDocument();
    expect(screen.getByText(/continue your brazilian jiu-jitsu registration/i)).toBeInTheDocument();
  });

  it("renders resume button", () => {
    render(
      <ResumeBanner
        programName="Archery"
        onResume={() => {}}
        onStartFresh={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
  });

  it("renders start fresh button", () => {
    render(
      <ResumeBanner
        programName="Archery"
        onResume={() => {}}
        onStartFresh={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /start fresh/i })).toBeInTheDocument();
  });

  it("calls onResume when resume button clicked", () => {
    const handleResume = vi.fn();
    render(
      <ResumeBanner
        programName="Archery"
        onResume={handleResume}
        onStartFresh={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /resume/i }));
    expect(handleResume).toHaveBeenCalledTimes(1);
  });

  it("calls onStartFresh when start fresh button clicked", () => {
    const handleStartFresh = vi.fn();
    render(
      <ResumeBanner
        programName="Archery"
        onResume={() => {}}
        onStartFresh={handleStartFresh}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /start fresh/i }));
    expect(handleStartFresh).toHaveBeenCalledTimes(1);
  });

  it("renders as fixed position banner", () => {
    render(
      <ResumeBanner
        programName="Outdoor Workshops"
        onResume={() => {}}
        onStartFresh={() => {}}
      />,
    );

    const banner = screen.getByText("Saved draft").closest(".fixed");
    expect(banner).toBeInTheDocument();
  });
});
