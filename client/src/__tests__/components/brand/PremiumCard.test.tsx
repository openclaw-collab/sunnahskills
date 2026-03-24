import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test-utils";
import { PremiumCard } from "@/components/brand/PremiumCard";

describe("PremiumCard", () => {
  it("renders children within a cream, large-radius card", () => {
    render(
      <PremiumCard>
        <span>Premium content</span>
      </PremiumCard>,
    );

    const card = screen.getByTestId("premium-card-root");
    expect(card).toBeInTheDocument();
    expect(screen.getByText("Premium content")).toBeInTheDocument();

    expect(card.className).toMatch(/bg-(cream|amber|yellow|stone|neutral)-?\d*/i);
    expect(card.className).toMatch(/rounded-(3xl|4xl|\[2\.5rem\]|\[2rem\])/);
  });

  it("accepts an optional title prop rendered as a heading", () => {
    render(<PremiumCard title="Premium Tier">x</PremiumCard>);

    expect(
      screen.getByRole("heading", { name: "Premium Tier" }),
    ).toBeInTheDocument();
  });

  it("allows passing additional className to the card", () => {
    render(
      <PremiumCard className="custom-premium-class">
        <span>content</span>
      </PremiumCard>,
    );

    const card = screen.getByTestId("premium-card-root");
    expect(card.className).toContain("custom-premium-class");
  });
});

