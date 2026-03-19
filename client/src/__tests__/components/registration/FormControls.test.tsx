import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { RadioGroup, CheckboxGroup, SelectField } from "@/components/registration/FormControls";

describe("RadioGroup", () => {
  const options = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B", sublabel: "With sublabel" },
  ];

  it("renders label and all options", () => {
    render(
      <RadioGroup
        label="Choose one"
        name="test-radio"
        value=""
        onChange={() => {}}
        options={options}
      />,
    );

    expect(screen.getByText("Choose one")).toBeInTheDocument();
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("renders sublabels when provided", () => {
    render(
      <RadioGroup
        label="Choose one"
        name="test-radio"
        value=""
        onChange={() => {}}
        options={options}
      />,
    );

    expect(screen.getByText("With sublabel")).toBeInTheDocument();
  });

  it("calls onChange when option selected", () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup
        label="Choose one"
        name="test-radio"
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    fireEvent.click(screen.getByLabelText("Option A"));
    expect(handleChange).toHaveBeenCalledWith("a");
  });

  it("displays error message when provided", () => {
    render(
      <RadioGroup
        label="Choose one"
        name="test-radio"
        value=""
        onChange={() => {}}
        options={options}
        error="Please select an option"
      />,
    );

    expect(screen.getByText("Please select an option")).toBeInTheDocument();
  });

  it("marks selected option with visual indicator", () => {
    const { rerender } = render(
      <RadioGroup
        label="Choose one"
        name="test-radio"
        value="a"
        onChange={() => {}}
        options={options}
      />,
    );

    rerender(
      <RadioGroup
        label="Choose one"
        name="test-radio"
        value="b"
        onChange={() => {}}
        options={options}
      />,
    );

    // Label accessible name includes sublabel text "With sublabel", use regex
    expect(screen.getByLabelText(/Option B/)).toBeChecked();
  });
});

describe("CheckboxGroup", () => {
  const options = [
    { value: "x", label: "Checkbox X" },
    { value: "y", label: "Checkbox Y" },
  ];

  it("renders label and all options", () => {
    render(
      <CheckboxGroup
        label="Choose multiple"
        options={options}
        values={[]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Choose multiple")).toBeInTheDocument();
    expect(screen.getByLabelText("Checkbox X")).toBeInTheDocument();
    expect(screen.getByLabelText("Checkbox Y")).toBeInTheDocument();
  });

  it("calls onChange with updated values when toggled", () => {
    const handleChange = vi.fn();
    render(
      <CheckboxGroup
        label="Choose multiple"
        options={options}
        values={[]}
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Checkbox X"));
    expect(handleChange).toHaveBeenCalledWith(["x"]);
  });

  it("removes value when unchecked", () => {
    const handleChange = vi.fn();
    render(
      <CheckboxGroup
        label="Choose multiple"
        options={options}
        values={["x", "y"]}
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Checkbox X"));
    expect(handleChange).toHaveBeenCalledWith(["y"]);
  });

  it("displays error message when provided", () => {
    render(
      <CheckboxGroup
        label="Choose multiple"
        options={options}
        values={[]}
        onChange={() => {}}
        error="Please select at least one"
      />,
    );

    expect(screen.getByText("Please select at least one")).toBeInTheDocument();
  });

  it("marks checked options", () => {
    render(
      <CheckboxGroup
        label="Choose multiple"
        options={options}
        values={["x"]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("Checkbox X")).toBeChecked();
    expect(screen.getByLabelText("Checkbox Y")).not.toBeChecked();
  });
});

describe("SelectField", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
  ];

  it("renders label and select element", () => {
    render(
      <SelectField
        label="Select one"
        value=""
        onChange={() => {}}
        options={options}
      />,
    );

    expect(screen.getByText("Select one")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders placeholder when provided", () => {
    render(
      <SelectField
        label="Select one"
        value=""
        onChange={() => {}}
        options={options}
        placeholder="Choose an option"
      />,
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("calls onChange when selection changes", () => {
    const handleChange = vi.fn();
    render(
      <SelectField
        label="Select one"
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(handleChange).toHaveBeenCalledWith("2");
  });

  it("displays error message when provided", () => {
    render(
      <SelectField
        label="Select one"
        value=""
        onChange={() => {}}
        options={options}
        error="Please select an option"
      />,
    );

    expect(screen.getByText("Please select an option")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(
      <SelectField
        label="Select one"
        value=""
        onChange={() => {}}
        options={options}
      />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.options.length).toBe(2);
  });

  it("calls onBlur when field loses focus", () => {
    const handleBlur = vi.fn();
    render(
      <SelectField
        label="Select one"
        value=""
        onChange={() => {}}
        options={options}
        onBlur={handleBlur}
      />,
    );

    fireEvent.blur(screen.getByRole("combobox"));
    expect(handleBlur).toHaveBeenCalled();
  });
});
