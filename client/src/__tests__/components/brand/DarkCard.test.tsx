import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test-utils";
import { DarkCard } from "@/components/brand/DarkCard";

describe("DarkCard", () => {
  it("renders children inside a dark wrapper", () => {
    render(
      <DarkCard>
        <p>Inner content</p>
      </DarkCard>,
    );

    const wrapper = screen.getByTestId("dark-card-root");
    expect(wrapper).toBeInTheDocument();
    expect(screen.getByText("Inner content")).toBeInTheDocument();

    expect(wrapper.className).toMatch(/bg-(charcoal|slate|zinc|stone|gray|neutral|black)/);
  });

  it("allows passing additional className to the wrapper", () => {
    render(<DarkCard className="custom-dark-class">x</DarkCard>);
    const wrapper = screen.getByTestId("dark-card-root");
    expect(wrapper.className).toContain("custom-dark-class");
  });
});

