import React, { useCallback, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";
import { render } from "./test-utils";
import AdminSequences from "@/pages/admin/AdminSequences";
import { mockStore } from "./mocks/handlers";

vi.mock("@/components/grapplemap/TechniqueViewer", () => ({
  TechniqueViewer: ({ sequenceData }: { sequenceData?: { frames?: unknown[] } }) => (
    <div data-testid="technique-viewer">{sequenceData?.frames?.length ?? 0}</div>
  ),
}));

function renderAdminSequencesAt(path = "/admin/sequences") {
  function useSequencesLocation(_router: unknown) {
    const [loc, setLoc] = useState(path);
    const nav = useCallback((to: string) => {
      setLoc(to);
    }, []);
    return [loc, nav] as [string, (to: string) => void];
  }

  return render(
    <Router hook={useSequencesLocation}>
      <AdminSequences />
    </Router>,
  );
}

describe("Admin sequence builder integration", () => {
  beforeEach(() => {
    mockStore.currentUser = {
      email: "muadh@sunnahskills.com",
      name: "Admin User",
      role: "admin",
    };

    server.use(
      http.get("/data/library/admin/positions.json", () =>
        HttpResponse.json({
          positions: [
            {
              id: "pos-401",
              sourceId: 401,
              graphNodeId: 401,
              libraryType: "position",
              name: "staredown",
              displayName: "Staredown",
              slug: "staredown",
              tags: ["standing"],
              props: [],
              frameCount: 1,
              previewPath: "/data/library/admin/positions/position-401.json",
              outgoingCount: 1,
              incomingCount: 0,
            },
            {
              id: "pos-94",
              sourceId: 94,
              graphNodeId: 94,
              libraryType: "position",
              name: "symmetric\\nstaggered\\nstanding",
              displayName: "Symmetric Staggered Standing",
              slug: "symmetric-staggered-standing",
              tags: ["standing"],
              props: [],
              frameCount: 1,
              previewPath: "/data/library/admin/positions/position-94.json",
              outgoingCount: 1,
              incomingCount: 1,
            },
            {
              id: "pos-490",
              sourceId: 490,
              graphNodeId: 490,
              libraryType: "position",
              name: "low flying\\ndouble leg",
              displayName: "Low Flying Double Leg",
              slug: "low-flying-double-leg",
              tags: ["double-leg"],
              props: [],
              frameCount: 1,
              previewPath: "/data/library/admin/positions/position-490.json",
              outgoingCount: 0,
              incomingCount: 1,
            },
          ],
        }),
      ),
      http.get("/data/library/admin/transitions.json", () =>
        HttpResponse.json({
          transitions: [
            {
              id: "tx-838",
              builderKey: "tx-838:forward",
              sourceId: 838,
              graphTransitionId: 838,
              libraryType: "transition",
              name: "begin",
              displayName: "Begin",
              slug: "begin",
              tags: ["opening"],
              props: [],
              frameCount: 8,
              previewPath: "/data/library/admin/transitions/transition-838.json",
              fromNodeId: 401,
              toNodeId: 94,
              fromDisplayName: "Staredown",
              toDisplayName: "Symmetric Staggered Standing",
              reverse: false,
              bidirectional: false,
              composerTitle: "Begin",
              composerSubtitle: "From staredown to symmetric staggered standing",
            },
          ],
        }),
      ),
      http.get("/data/library/admin/graph-links.json", () =>
        HttpResponse.json({
          nodes: [
            { id: 401, incoming: [], outgoing: [{ transitionId: 838, reverse: false }] },
            { id: 94, incoming: [{ transitionId: 838, reverse: false }], outgoing: [] },
            { id: 490, incoming: [], outgoing: [] },
          ],
        }),
      ),
      http.get("/data/library/admin/:kind/:file", ({ params }) =>
        HttpResponse.json({
          meta: {
            id: String(params.file),
            sourceId: 0,
            libraryType: params.kind === "transitions" ? "transition" : "position",
            name: String(params.file),
            slug: String(params.file),
            tags: [],
            props: [],
            frameCount: 0,
            previewPath: `/data/library/admin/${params.kind}/${params.file}`,
          },
          markers: [],
          frames: [],
        }),
      ),
      http.get("/api/admin/sequences", () =>
        HttpResponse.json({
          sequences: [
            {
              id: "double-leg-to-mount-escape-full-chain",
              meta: {
                id: "double-leg-to-mount-escape-full-chain",
                slug: "double-leg-to-mount-escape-full-chain",
                name: "Staredown to Double Leg Entry",
                positionCategory: "standing",
                startingPosition: "Staredown",
                endingPosition: "Low Flying Double Leg",
                difficulty: "intermediate",
                description: ["Standing entry sequence.", "Starts in staredown and drives into the double leg."],
                grapplemapPathSpec: [
                  { type: "position", id: 401 },
                  { type: "transition", id: 838 },
                  { type: "position", id: 94 },
                ],
                grapplemapPathString: "p401, t838, p94",
              },
              markers: [
                { name: "staredown", frame: 0, type: "position" },
                { name: "begin", frame: 0, type: "transition" },
                { name: "symmetric\\nstaggered\\nstanding", frame: 8, type: "position" },
              ],
              frames: [[[]]],
              verified: true,
            },
          ],
        }),
      ),
      http.post("/api/admin/grapplemap-extract", async () =>
        HttpResponse.json({
          frames: [],
          markers: [
            { name: "staredown", frame: 0, type: "position" },
            { name: "begin", frame: 0, type: "transition" },
            { name: "symmetric\\nstaggered\\nstanding", frame: 8, type: "position" },
          ],
          meta: { totalFrames: 0 },
        }),
      ),
    );
  });

  it("loads an existing published technique back into the builder for editing", async () => {
    const user = userEvent.setup();
    renderAdminSequencesAt();

    expect(await screen.findByText(/Drafts and published techniques/i)).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /staredown to double leg entry/i }));
    await user.click(await screen.findByRole("button", { name: /edit in builder/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Staredown to Double Leg Entry")).toBeInTheDocument();
    });

    expect(screen.getByText(/Loaded Staredown to Double Leg Entry into the builder for editing\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/p401 -> t838 -> p94/i).length).toBeGreaterThan(0);
  });
});
