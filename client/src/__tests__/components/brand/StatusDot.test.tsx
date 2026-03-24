import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test-utils";
import { StatusDot } from "@/components/brand/StatusDot";

describe("StatusDot", () => {
  it("renders a small clay-colored circle", () => {
    render(<StatusDot ariaLabel="online" />);

    const dot = screen.getByTestId("status-dot");
    expect(dot).toBeInTheDocument();

    expect(dot.className).toMatch(/w-?[12]/);
    expect(dot.className).toMatch(/h-?[12]/);
    expect(dot.className).toMatch(/rounded-full/);
    expect(dot.className).toMatch(/bg-(clay|amber|orange|stone|neutral)-?\d*/i);
  });

  it("supports an accessible label via aria-label", () => {
    render(<StatusDot ariaLabel="Currently online" />);

    const dot = screen.getByLabelText("Currently online");
    expect(dot).toBeInTheDocument();
  });

  it("allows additional className for positioning", () => {
    render(<StatusDot ariaLabel="online" className="absolute top-0" />);

    const dot = screen.getByTestId("status-dot");
    expect(dot.className).toContain("absolute");
    expect(dot.className).toContain("top-0");
  });
});

