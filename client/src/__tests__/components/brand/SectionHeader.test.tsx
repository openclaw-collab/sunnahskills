import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "../../test-utils";
import { SectionHeader } from "@/components/brand/SectionHeader";

describe("SectionHeader", () => {
  it("renders main heading text", () => {
    render(<SectionHeader title="Program Overview" />);
    expect(
      screen.getByRole("heading", { name: "Program Overview" }),
    ).toBeInTheDocument();
  });

  it("renders optional eyebrow label when provided", () => {
    render(
      <SectionHeader eyebrow="Sunnah Skills" title="Program Overview" />,
    );

    expect(screen.getByText("Sunnah Skills")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Program Overview" }),
    ).toBeInTheDocument();
  });

  it("allows passing additional className for layout customization", () => {
    render(
      <SectionHeader
        eyebrow="Label"
        title="Title"
        className="custom-section-header"
      />,
    );

    const root = screen.getByTestId("section-header-root");
    expect(root.className).toContain("custom-section-header");
  });
}
);

