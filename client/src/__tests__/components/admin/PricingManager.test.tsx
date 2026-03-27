import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/__tests__/test-utils";
import { PricingManager } from "@/components/admin/PricingManager";

describe("PricingManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/admin/semesters")) {
        return {
          ok: true,
          json: async () => ({ semesters: [] }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          programs: [{ id: "bjj", name: "Brazilian Jiu-Jitsu", slug: "bjj" }],
          prices: [
            {
              id: 1,
              program_id: "bjj",
              age_group: "6-10",
              label: "Youth",
              amount: 15000,
              frequency: "monthly",
              registration_fee: 5000,
              active: 1,
            },
          ],
        }),
      };
    });
  });

  it("renders header and description", async () => {
    render(<PricingManager />);

    expect(await screen.findByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText(/edit price tiers/i)).toBeInTheDocument();
  });

  it("renders refresh button", async () => {
    render(<PricingManager />);

    expect(await screen.findByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("renders program sections", async () => {
    render(<PricingManager />);

    expect(await screen.findByText("Brazilian Jiu-Jitsu")).toBeInTheDocument();
    expect(screen.getByText(/bjj • \/programs\/bjj/)).toBeInTheDocument();
  });

  it("renders price table headers", async () => {
    render(<PricingManager />);

    expect(await screen.findByText("Tier")).toBeInTheDocument();
    expect(screen.getByText("Frequency")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Reg fee")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("displays price tier information", async () => {
    render(<PricingManager />);

    expect(await screen.findByText("Youth")).toBeInTheDocument();
    expect(screen.getByText("6-10")).toBeInTheDocument();
    expect(screen.getByText("monthly")).toBeInTheDocument();
  });

  it("formats amounts as currency", async () => {
    render(<PricingManager />);

    expect(await screen.findByText("$150.00")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
  });

  it("renders enable/disable button", async () => {
    render(<PricingManager />);

    expect(await screen.findByRole("button", { name: /disable/i })).toBeInTheDocument();
  });

  it("renders save button", async () => {
    render(<PricingManager />);

    expect(await screen.findByRole("button", { name: /save/i })).toBeInTheDocument();
  });
});
