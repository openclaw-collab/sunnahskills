import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../test-utils";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { MagneticButton } from "@/components/brand/MagneticButton";

describe("ClayButton", () => {
  it("renders as a button with given label", () => {
    render(<ClayButton>Click me</ClayButton>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("forwards onClick handler", () => {
    const handleClick = vi.fn();
    render(<ClayButton onClick={handleClick}>Click</ClayButton>);

    fireEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("composes className onto clay-style base", () => {
    render(<ClayButton className="extra-class">Click</ClayButton>);

    const button = screen.getByRole("button", { name: "Click" });
    expect(button.className).toContain("extra-class");
    expect(button.className).toMatch(/rounded-(full|3xl|\[2rem\])/);
    expect(button.className).toMatch(/shadow/);
  });
});

describe("OutlineButton", () => {
  it("renders as a button with given label", () => {
    render(<OutlineButton>Outline</OutlineButton>);
    expect(
      screen.getByRole("button", { name: "Outline" }),
    ).toBeInTheDocument();
  });

  it("forwards arbitrary button props (e.g., type)", () => {
    render(
      <OutlineButton type="submit">
        Submit
      </OutlineButton>,
    );

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("composes outline-specific styles and extra className", () => {
    render(
      <OutlineButton className="outline-extra">
        Outline
      </OutlineButton>,
    );

    const button = screen.getByRole("button", { name: "Outline" });
    expect(button.className).toContain("outline-extra");
    expect(button.className).toMatch(/border|outline/);
  });
});

describe("MagneticButton", () => {
  it("renders as a button with given label", () => {
    render(<MagneticButton>Magnet</MagneticButton>);
    expect(
      screen.getByRole("button", { name: "Magnet" }),
    ).toBeInTheDocument();
  });

  it("forwards onClick and other props", () => {
    const handleClick = vi.fn();
    render(
      <MagneticButton
        onClick={handleClick}
        aria-label="magnetic button"
      >
        Magnet
      </MagneticButton>,
    );

    const button = screen.getByRole("button", { name: "Magnet" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-label", "magnetic button");
  });

  it("composes magnetic-specific className plus extra classes", () => {
    render(
      <MagneticButton className="magnetic-extra">
        Magnet
      </MagneticButton>,
    );

    const button = screen.getByRole("button", { name: "Magnet" });
    expect(button.className).toContain("magnetic-extra");
    expect(button.className).toMatch(
      /(transform|transition|ring|hover:scale|hover:translate)/,
    );
  });
});

