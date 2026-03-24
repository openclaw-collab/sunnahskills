import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders as an input element", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("forwards value and onChange handler", () => {
    const handleChange = vi.fn();
    render(<Input value="test" onChange={handleChange} />);

    const input = screen.getByDisplayValue("test");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "new value" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("supports different input types", () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");

    rerender(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

    rerender(<Input type="password" placeholder="password" />);
    const passwordInput = screen.getByPlaceholderText("password");
    expect(passwordInput.tagName.toLowerCase()).toBe("input");
    expect(passwordInput).toHaveAttribute("type", "password");

    rerender(<Input type="number" />);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");
  });

  it("composes className onto base styles", () => {
    render(<Input className="custom-input-class" />);

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("custom-input-class");
  });

  it("supports disabled state", () => {
    render(<Input disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("supports required attribute", () => {
    render(<Input required />);

    const input = screen.getByRole("textbox");
    expect(input).toBeRequired();
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("supports name attribute", () => {
    render(<Input name="username" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "username");
  });
});
