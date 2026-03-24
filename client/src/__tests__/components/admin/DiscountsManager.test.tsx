import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/__tests__/test-utils";
import { DiscountsManager } from "@/components/admin/DiscountsManager";

describe("DiscountsManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn(async (url: string) => {
      if (url.includes("/api/admin/discounts")) {
        return { ok: true, json: async () => ({ discounts: [] }) };
      }
      if (url.includes("/api/admin/programs")) {
        return { ok: true, json: async () => ({ programs: [{ id: "bjj", name: "Brazilian Jiu-Jitsu", slug: "bjj" }] }) };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it("renders header and description", async () => {
    render(<DiscountsManager />);

    expect(await screen.findByText("Discounts")).toBeInTheDocument();
    expect(screen.getByText(/create promo codes/i)).toBeInTheDocument();
  });

  it("renders form fields for creating discount", async () => {
    render(<DiscountsManager />);

    // "Code", "Type", "Value", "Program" appear in both form labels and table headers — use getAllByText
    expect((await screen.findAllByText("Code")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Type").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Value").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Program").length).toBeGreaterThanOrEqual(1);
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

    // Wait for component to load (Code appears in both form label and table header)
    await screen.findAllByText("Code");
    const codeInput = screen.getByPlaceholderText("SPRING10");
    fireEvent.change(codeInput, { target: { value: "SUMMER20" } });

    expect(codeInput).toHaveValue("SUMMER20");
  });

  it("updates value input when changed", async () => {
    render(<DiscountsManager />);

    // Wait for component to load (Value appears in both form label and table header)
    await screen.findAllByText("Value");
    const inputs = screen.getAllByRole("spinbutton");
    const valueInput = inputs[0];
    fireEvent.change(valueInput, { target: { value: "20" } });

    expect(valueInput).toHaveValue(20);
  });

  it("renders table headers", async () => {
    render(<DiscountsManager />);

    // "Code", "Type", "Value", "Program" appear in both form labels and table headers
    expect((await screen.findAllByText("Code")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Type").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Value").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Uses")).toBeInTheDocument();
    expect(screen.getAllByText("Program").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});
