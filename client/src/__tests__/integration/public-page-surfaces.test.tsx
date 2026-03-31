import React, { useState } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Router } from "wouter";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../test-utils";
import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import Testimonials from "@/pages/Testimonials";
import TechniqueLibrary from "@/pages/TechniqueLibrary";

vi.mock("@/components/grapplemap/TechniqueViewer", () => ({
  TechniqueViewer: () => <div data-testid="technique-viewer-stub" />,
}));

vi.mock("@/components/TechniqueModal", () => ({
  TechniqueModal: ({ scene }: { scene: { meta: { name: string } } | null }) =>
    scene ? <div data-testid="technique-modal">{scene.meta.name}</div> : null,
}));

function renderAt(path: string, ui: React.ReactElement) {
  window.history.pushState({}, "", path);

  function useMemoryLocation() {
    const [loc, setLoc] = useState(path);
    return [loc, setLoc] as [string, React.Dispatch<React.SetStateAction<string>>];
  }

  return render(<Router hook={useMemoryLocation}>{ui}</Router>);
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

function installPublicFetchMock() {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url === "/api/programs") {
      return jsonResponse({
        programs: [
          {
            id: "bjj",
            slug: "bjj",
            name: "Brazilian Jiu-Jitsu",
            status: "active",
            sessions: [],
            prices: [
              { id: 1, program_id: "bjj", age_group: "girls-5-10", label: "Girls 5–10", amount: 1200, frequency: "semester", registration_fee: 0, metadata: null },
              { id: 2, program_id: "bjj", age_group: "boys-7-13", label: "Boys 7–13", amount: 1200, frequency: "semester", registration_fee: 0, metadata: null },
              { id: 3, program_id: "bjj", age_group: "women-11-tue", label: "Women 11+ Tuesday", amount: 2000, frequency: "semester", registration_fee: 0, metadata: null },
              { id: 4, program_id: "bjj", age_group: "women-11-thu", label: "Women 11+ Thursday", amount: 2000, frequency: "semester", registration_fee: 0, metadata: null },
              { id: 5, program_id: "bjj", age_group: "men-14", label: "Men 14+", amount: 1400, frequency: "semester", registration_fee: 0, metadata: null },
            ],
            active_semester: {
              id: 1,
              name: "Spring 2026",
              program_id: "bjj",
              start_date: "2026-03-01",
              end_date: "2026-05-31",
              classes_in_semester: 13,
              price_per_class_cents: 0,
              registration_fee_cents: 0,
              later_payment_date: "2026-05-12",
              active: 1,
            },
          },
        ],
      });
    }

    if (url === "/data/library/sequences/manifest.json") {
      return jsonResponse({ sequences: [] });
    }

    if (url === "/api/techniques") {
      return jsonResponse({ techniques: [] });
    }

    if (url.startsWith("/api/techniques?id=")) {
      const slug = new URL(url, "http://localhost").searchParams.get("id") ?? "technique";
      const metaBySlug: Record<string, { name: string; stage: "standing" | "guard" | "escapes"; tags: string[] }> = {
        "double-leg-to-mount-escape-full-chain": {
          name: "Standing Wrist Control to Double Leg",
          stage: "standing",
          tags: ["wrist control", "double leg"],
        },
        "arm-drag-to-back-finish": {
          name: "Arm Drag to Back Finish",
          stage: "guard",
          tags: ["arm drag", "back take"],
        },
        "collar-tie-ankle-pick-to-armbar": {
          name: "Collar Tie Ankle Pick to Armbar",
          stage: "escapes",
          tags: ["ankle pick", "armbar"],
        },
      };
      const meta = metaBySlug[slug] ?? {
        name: slug.replace(/-/g, " "),
        stage: "standing",
        tags: [slug],
      };

      return jsonResponse({
        meta: {
          name: meta.name,
          curriculumStage: meta.stage,
          tags: meta.tags,
          description: [`${meta.name} overview`, `A focused sequence for ${meta.name.toLowerCase()}.`],
          startingPosition: "Start",
          endingPosition: "Finish",
          positionCategory: "standing",
          totalFrames: 24,
        },
        markers: [
          { name: "Start", frame: 0, type: "position" },
          { name: "Finish", frame: 24, type: "position" },
        ],
      });
    }

    return jsonResponse({}, false);
  }) as typeof fetch;
}

describe("Public page surfaces", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    installPublicFetchMock();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders the home page overview, pricing, and interactive snapshot", async () => {
    const user = userEvent.setup();
    renderAt("/", <Home />);

    expect(await screen.findByText("This Week at Sunnah Skills")).toBeInTheDocument();
    expect(screen.getByTestId("home-overview")).toBeInTheDocument();
    expect(screen.getByTestId("academy-snapshot-card")).toBeInTheDocument();
    expect(screen.getByTestId("home-mini-schedule")).toBeInTheDocument();
    expect(screen.getByTestId("enrollment-tracks")).toBeInTheDocument();
    expect(screen.getByTestId("curriculum-card-swimming")).toBeInTheDocument();
    expect(screen.getByTestId("curriculum-card-horseback")).toBeInTheDocument();
    expect(screen.getAllByText(/semester tuition/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("enrollment-card-girls")).toBeInTheDocument();
    expect(screen.getByText(/View technique library/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Show Trial Flow/i));
    expect((await screen.findAllByText("QR Ready")).length).toBeGreaterThan(0);
  });

  it("renders the contact page channels and intake form", async () => {
    renderAt("/contact", <Contact />);

    expect(await screen.findByText("Contact Channels")).toBeInTheDocument();
    expect(screen.getByText(/Get in Touch/i)).toBeInTheDocument();
    expect(screen.getByText(/mysunnahskill@gmail.com/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("renders the testimonials page with family quotes and the cta", async () => {
    renderAt("/testimonials", <Testimonials />);

    expect(await screen.findByText(/What Families Say/i)).toBeInTheDocument();
    expect(screen.getByText(/Parent of Ahmed \(12\)/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders the technique library with filters, search, and modal selection", async () => {
    const user = userEvent.setup();
    renderAt("/techniques", <TechniqueLibrary />);

    expect(await screen.findByText(/Technique Library/i)).toBeInTheDocument();
    expect(await screen.findByText("Arm Drag to Back Finish")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search techniques, tags, positions, or source...")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /submissions/i }));
    expect(await screen.findByText(/no techniques match that filter/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /all/i }));

    await user.clear(screen.getByPlaceholderText("Search techniques, tags, positions, or source..."));
    await user.type(screen.getByPlaceholderText("Search techniques, tags, positions, or source..."), "arm drag");
    await waitFor(() => {
      expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText("Arm Drag to Back Finish"));
    expect(await screen.findByTestId("technique-modal")).toHaveTextContent("Arm Drag to Back Finish");
  });
});
