import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/__tests__/test-utils";
import { DiscountsManager } from "@/components/admin/DiscountsManager";

describe("DiscountsManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        discounts: [],
        programs: [
          { id: "bjj", name: "Brazilian Jiu-Jitsu", slug: "bjj" },
        ],
      }),
    }));
  });

  it("renders header and description", async () => {
    render(<DiscountsManager />);

    expect(await screen.findByText("Discounts")).toBeInTheDocument();
    expect(screen.getByText(/create promo codes/i)).toBeInTheDocument();
  });

  it("renders form fields for creating discount", async () => {
    render(<DiscountsManager />);

    expect(await screen.findByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Program")).toBeInTheDocument();
    expect(screen.getByText("Max uses")).toBeInTheDocument();
  });

  it("renders create discount button", async () => {
    render(<DiscountsManager />);

    expect(await screen.findByRole("button", { name: /create discount/i })).toBeInTheDocument();
  });

  it("renders refresh button", async () => {
    render(<DiscountsManager />);

    expect(await screen.findByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("updates code input when typed", async () => {
    render(<DiscountsManager />);

    await screen.findByText("Code");
    const codeInput = screen.getByPlaceholderText("SPRING10");
    fireEvent.change(codeInput, { target: { value: "SUMMER20" } });

    expect(codeInput).toHaveValue("SUMMER20");
  });

  it("updates value input when changed", async () => {
    render(<DiscountsManager />);

    await screen.findByText("Value");
    const inputs = screen.getAllByRole("spinbutton");
    const valueInput = inputs[0];
    fireEvent.change(valueInput, { target: { value: "20" } });

    expect(valueInput).toHaveValue(20);
  });

  it("renders table headers", async () => {
    render(<DiscountsManager />);

    expect(await screen.findByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Uses")).toBeInTheDocument();
    expect(screen.getByText("Program")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});
