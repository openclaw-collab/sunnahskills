import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/__tests__/test-utils";
import { ContactsTable } from "@/components/admin/ContactsTable";

describe("ContactsTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        contacts: [
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            message: "I have a question about the BJJ program.",
            timestamp: "2026-03-15T10:00:00Z",
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            message: "When does the next archery session start?",
            timestamp: "2026-03-16T14:30:00Z",
          },
        ],
      }),
    }));
  });

  it("renders header and description", async () => {
    render(<ContactsTable />);

    expect(await screen.findByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText(/submissions from the contact form/i)).toBeInTheDocument();
  });

  it("renders refresh button", async () => {
    render(<ContactsTable />);

    expect(await screen.findByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("renders table headers", async () => {
    render(<ContactsTable />);

    expect(await screen.findByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("displays contact information", async () => {
    render(<ContactsTable />);

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("I have a question about the BJJ program.")).toBeInTheDocument();
  });

  it("displays multiple contacts", async () => {
    render(<ContactsTable />);

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("displays empty state when no contacts", async () => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ contacts: [] }),
    }));

    render(<ContactsTable />);

    expect(await screen.findByText(/no contact submissions yet/i)).toBeInTheDocument();
  });

  it("renders within PremiumCard", async () => {
    render(<ContactsTable />);

    const card = await screen.findByTestId("premium-card-root");
    expect(card).toBeInTheDocument();
  });

  it("lets an admin reply to a contact by email", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      return {
        ok: true,
        json: async () => ({
          contacts: [
            {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              message: "I have a question about the BJJ program.",
              timestamp: "2026-03-15T10:00:00Z",
            },
          ],
        }),
      };
    });
    (globalThis as any).fetch = fetchMock;

    render(<ContactsTable />);

    fireEvent.click(await screen.findByRole("button", { name: /reply to john doe/i }));
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: "Re: BJJ program" } });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Assalamu alaykum. We can help with that." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reply/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/contacts",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            contactId: 1,
            subject: "Re: BJJ program",
            message: "Assalamu alaykum. We can help with that.",
          }),
        }),
      );
    });
    expect(await screen.findByText(/reply sent/i)).toBeInTheDocument();
  });
});
