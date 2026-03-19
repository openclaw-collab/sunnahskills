import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/__tests__/test-utils";
import { SessionManager } from "@/components/admin/SessionManager";

describe("SessionManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        sessions: [
          {
            id: 1,
            program_id: "bjj",
            name: "Youth BJJ - Tuesday",
            day_of_week: "Tuesday",
            start_time: "16:00",
            end_time: "17:00",
            age_group: "6-10",
            capacity: 20,
            enrolled_count: 12,
            status: "active",
            visible: 1,
          },
        ],
      }),
    }));
  });

  it("renders header and description", async () => {
    render(<SessionManager />);

    expect(await screen.findByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText(/toggle visibility/i)).toBeInTheDocument();
  });

  it("renders refresh button", async () => {
    render(<SessionManager />);

    expect(await screen.findByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("renders table headers", async () => {
    render(<SessionManager />);

    expect(await screen.findByText("Session")).toBeInTheDocument();
    expect(screen.getByText("Age group")).toBeInTheDocument();
    expect(screen.getByText("Capacity")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Visible")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("displays session information", async () => {
    render(<SessionManager />);

    expect(await screen.findByText("Youth BJJ - Tuesday")).toBeInTheDocument();
    // "Tuesday" appears in session name AND in the day/time cell — use getAllByText
    expect(screen.getAllByText(/Tuesday/).length).toBeGreaterThanOrEqual(1);
    // time cell is "Tuesday • 16:00–17:00" — match with regex on the cell text
    expect(screen.getByText(/16:00/)).toBeInTheDocument();
    expect(screen.getByText(/17:00/)).toBeInTheDocument();
  });

  it("displays enrollment count", async () => {
    render(<SessionManager />);

    expect(await screen.findByText("12 / 20")).toBeInTheDocument();
  });

  it("displays status and visibility", async () => {
    render(<SessionManager />);

    expect(await screen.findByText("active")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("renders hide/show button", async () => {
    render(<SessionManager />);

    expect(await screen.findByRole("button", { name: /hide/i })).toBeInTheDocument();
  });

  it("renders toggle status button", async () => {
    render(<SessionManager />);

    expect(await screen.findByRole("button", { name: /toggle status/i })).toBeInTheDocument();
  });

  it("displays empty state when no sessions", async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ sessions: [] }),
    }));

    render(<SessionManager />);

    expect(await screen.findByText(/no sessions found/i)).toBeInTheDocument();
  });
});
