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
              id: "pos-21",
              sourceId: 21,
              graphNodeId: 21,
              libraryType: "position",
              name: "standing vs\\nde la riva",
              displayName: "Standing Vs De La Riva",
              slug: "standing-vs-de-la-riva",
              tags: ["standing"],
              props: [],
              frameCount: 1,
              previewPath: "/data/library/admin/positions/position-21.json",
              outgoingCount: 1,
              incomingCount: 1,
            },
            {
              id: "pos-46",
              sourceId: 46,
              graphNodeId: 46,
              libraryType: "position",
              name: "standing vs\\nreverse dlr",
              displayName: "Standing Vs Reverse Dlr",
              slug: "standing-vs-reverse-dlr",
              tags: ["standing"],
              props: [],
              frameCount: 1,
              previewPath: "/data/library/admin/positions/position-46.json",
              outgoingCount: 1,
              incomingCount: 1,
            },
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
              outgoingCount: 2,
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
              incomingCount: 2,
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
            {
              id: "tx-485",
              builderKey: "tx-485:forward",
              sourceId: 485,
              graphTransitionId: 485,
              libraryType: "transition",
              name: "reverse",
              displayName: "Reverse",
              slug: "reverse",
              tags: ["standing", "bidirectional"],
              props: ["bidirectional"],
              frameCount: 4,
              previewPath: "/data/library/admin/transitions/transition-485.json",
              fromNodeId: 46,
              toNodeId: 21,
              fromDisplayName: "Standing Vs Reverse Dlr",
              toDisplayName: "Standing Vs De La Riva",
              reverse: false,
              bidirectional: true,
              composerTitle: "Reverse",
              composerSubtitle: "From Standing Vs Reverse Dlr to Standing Vs De La Riva",
            },
            {
              id: "tx-999",
              builderKey: "tx-999:forward",
              sourceId: 999,
              graphTransitionId: 999,
              libraryType: "transition",
              name: "far away route",
              displayName: "Far Away Route",
              slug: "far-away-route",
              tags: ["standing"],
              props: [],
              frameCount: 4,
              previewPath: "/data/library/admin/transitions/transition-999.json",
              fromNodeId: 46,
              toNodeId: 490,
              fromDisplayName: "Standing Vs Reverse Dlr",
              toDisplayName: "Low Flying Double Leg",
              reverse: false,
              bidirectional: false,
              composerTitle: "Far Away Route",
              composerSubtitle: "From Standing Vs Reverse Dlr to Low Flying Double Leg",
            },
            {
              id: "tx-840",
              builderKey: "tx-840:forward",
              sourceId: 840,
              graphTransitionId: 840,
              libraryType: "transition",
              name: "snap double",
              displayName: "Snap Double",
              slug: "snap-double",
              tags: ["standing", "double-leg"],
              props: [],
              frameCount: 6,
              previewPath: "/data/library/admin/transitions/transition-840.json",
              fromNodeId: 401,
              toNodeId: 490,
              fromDisplayName: "Staredown",
              toDisplayName: "Low Flying Double Leg",
              reverse: false,
              bidirectional: false,
              composerTitle: "Snap Double",
              composerSubtitle: "From Staredown to Low Flying Double Leg",
            },
          ],
        }),
      ),
      http.get("/data/library/admin/graph-links.json", () =>
        HttpResponse.json({
          nodes: [
            {
              id: 401,
              incoming: [],
              outgoing: [
                { transitionId: 838, reverse: false },
                { transitionId: 840, reverse: false },
              ],
            },
            { id: 94, incoming: [{ transitionId: 838, reverse: false }], outgoing: [] },
            {
              id: 21,
              incoming: [{ transitionId: 485, reverse: false }],
              outgoing: [{ transitionId: 485, reverse: true }],
            },
            {
              id: 46,
              incoming: [{ transitionId: 485, reverse: true }],
              outgoing: [{ transitionId: 485, reverse: false }, { transitionId: 999, reverse: false }],
            },
            { id: 490, incoming: [{ transitionId: 840, reverse: false }], outgoing: [] },
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
      http.post("/api/admin/grapplemap-extract", async ({ request }) => {
        const body = (await request.json().catch(() => null)) as
          | { sequence?: Array<{ type: "position" | "transition"; id: number; reverse?: boolean }> }
          | null;
        const spec = body?.sequence ?? [];
        return HttpResponse.json({
          frames: spec.length ? [[[[]]], [[[]]]] : [],
          markers: spec.map((step, index) => ({
            name: step.type === "position" ? `position-${step.id}` : `transition-${step.id}${step.reverse ? "r" : ""}`,
            frame: index,
            type: step.type,
          })),
          meta: { totalFrames: spec.length ? 2 : 0 },
        });
      }),
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

  it("round-trips reverse transitions when loading an existing sequence", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("/api/admin/sequences", () =>
        HttpResponse.json({
          sequences: [
            {
              id: "reverse-standing-entry",
              meta: {
                id: "reverse-standing-entry",
                slug: "reverse-standing-entry",
                name: "Reverse Standing Entry",
                positionCategory: "standing",
                startingPosition: "Standing Vs De La Riva",
                endingPosition: "Standing Vs Reverse Dlr",
                difficulty: "intermediate",
                description: ["Reverse standing entry.", "Loads a reverse graph route."],
                grapplemapPathSpec: [
                  { type: "position", id: 21 },
                  { type: "transition", id: 485, reverse: true },
                  { type: "position", id: 46 },
                ],
                grapplemapPathString: "p21, t485r, p46",
              },
              markers: [
                { name: "standing vs\\nde la riva", frame: 0, type: "position" },
                { name: "reverse", frame: 0, type: "transition", reverse: true },
                { name: "standing vs\\nreverse dlr", frame: 3, type: "position" },
              ],
              frames: [[[]]],
              verified: true,
            },
          ],
        }),
      ),
    );

    renderAdminSequencesAt();

    await user.click(await screen.findByRole("button", { name: /reverse standing entry/i }));
    await user.click(await screen.findByRole("button", { name: /edit in builder/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Reverse Standing Entry")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/p21 -> t485r -> p46/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/standing vs de la riva -> standing vs reverse dlr/i).length).toBeGreaterThan(0);
  });

  it("blocks disconnected transitions in the search tab and clearly labels connected ones", async () => {
    const user = userEvent.setup();
    renderAdminSequencesAt();

    await user.click(await screen.findByRole("button", { name: /staredown to double leg entry/i }));
    await user.click(await screen.findByRole("button", { name: /edit in builder/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Staredown to Double Leg Entry")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^search$/i }));
    await user.click(screen.getByRole("button", { name: /^transitions$/i }));
    await user.type(screen.getByPlaceholderText(/search transitions/i), "far away");

    expect(await screen.findByText(/far away route/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnected/i })).toBeDisabled();

    await user.clear(screen.getByPlaceholderText(/search transitions/i));
    await user.type(screen.getByPlaceholderText(/search transitions/i), "begin");

    expect((await screen.findAllByText(/^begin$/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /add after/i }).length).toBeGreaterThan(0);
  });

  it("keeps the full sequence preview visible while composing outside the review tab", async () => {
    const user = userEvent.setup();
    renderAdminSequencesAt();

    await user.click(await screen.findByRole("button", { name: /staredown to double leg entry/i }));
    await user.click(await screen.findByRole("button", { name: /edit in builder/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Staredown to Double Leg Entry")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^add after$/i }));

    expect(screen.getByText(/full sequence preview/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("technique-viewer")[0]).toHaveTextContent("2");
  });

  it("replaces a transition from the current anchor and resets the tail when the landing node changes", async () => {
    const user = userEvent.setup();
    renderAdminSequencesAt();

    await user.click(await screen.findByRole("button", { name: /staredown to double leg entry/i }));
    await user.click(await screen.findByRole("button", { name: /edit in builder/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Staredown to Double Leg Entry")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /replace begin/i }));
    await user.type(screen.getByPlaceholderText(/search transitions/i), "snap");
    await user.click(await screen.findByRole("button", { name: /replace from here/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/p401 -> t840 -> p490/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/low flying double leg/i).length).toBeGreaterThan(0);
  });

  it("can flip an isolated bidirectional transition when editing an existing sequence", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("/api/admin/sequences", () =>
        HttpResponse.json({
          sequences: [
            {
              id: "reverse-standing-entry",
              meta: {
                id: "reverse-standing-entry",
                slug: "reverse-standing-entry",
                name: "Reverse Standing Entry",
                positionCategory: "standing",
                startingPosition: "Standing Vs De La Riva",
                endingPosition: "Standing Vs Reverse Dlr",
                difficulty: "intermediate",
                description: ["Reverse standing entry.", "Loads a reverse graph route."],
                grapplemapPathSpec: [
                  { type: "position", id: 21 },
                  { type: "transition", id: 485, reverse: true },
                  { type: "position", id: 46 },
                ],
                grapplemapPathString: "p21, t485r, p46",
              },
              markers: [
                { name: "standing vs\\nde la riva", frame: 0, type: "position" },
                { name: "reverse", frame: 0, type: "transition", reverse: true },
                { name: "standing vs\\nreverse dlr", frame: 3, type: "position" },
              ],
              frames: [[[]]],
              verified: true,
            },
          ],
        }),
      ),
    );

    renderAdminSequencesAt();

    await user.click(await screen.findByRole("button", { name: /reverse standing entry/i }));
    await user.click(await screen.findByRole("button", { name: /edit in builder/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Reverse Standing Entry")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /flip reverse/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/p46 -> t485 -> p21/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/flipped the route direction for this isolated step/i)).toBeInTheDocument();
  });

  it("offers coach-friendly start filters and plain-language route labels", async () => {
    const user = userEvent.setup();
    renderAdminSequencesAt();

    expect(await screen.findByText(/Coach filters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^standing$/i })).toBeInTheDocument();
    expect(screen.getAllByText(/next options/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/outgoing routes/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^standing$/i }));
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
  });

  it("shows a persistent sequence timeline while a coach builds a chain", async () => {
    const user = userEvent.setup();
    renderAdminSequencesAt();

    await user.type(await screen.findByPlaceholderText(/search starting positions/i), "staredown");
    await user.click(screen.getByRole("button", { name: /use this start/i }));

    expect(await screen.findByText(/Sequence timeline/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Staredown/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Full sequence preview/i)).toBeInTheDocument();
  });
});
