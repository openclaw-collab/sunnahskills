import { describe, expect, it, vi, beforeEach } from "vitest";
import { onRequestPost as extractHandler } from "../api/admin/grapplemap-extract";
import { onRequestPost as saveSequenceHandler } from "../api/admin/sequences";
import { createMockRequest, parseJsonResponse } from "./setup";
import { PREDEFINED_SEQUENCES } from "../../shared/grapplemapFlatSequence";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("../_utils/adminAuth", () => ({
  getAdminFromRequest: vi.fn().mockResolvedValue({ adminUserId: 7 }),
  hasAdminPermission: vi.fn().mockReturnValue(true),
}));

describe("admin GrappleMap sequence routes", () => {
  const grapplemapText = readFileSync(join(process.cwd(), "GrappleMap", "GrappleMap.txt"), "utf8");
  const doubleLegSpec = [
    { type: "position", id: 401 },
    { type: "transition", id: 838 },
    { type: "position", id: 94 },
    { type: "transition", id: 336 },
    { type: "position", id: 614 },
    { type: "transition", id: 1473 },
    { type: "position", id: 96 },
    { type: "transition", id: 337 },
    { type: "position", id: 490 },
    { type: "transition", id: 1140 },
    { type: "position", id: 668 },
    { type: "transition", id: 1146 },
    { type: "position", id: 125 },
    { type: "transition", id: 460 },
    { type: "position", id: 59 },
    { type: "transition", id: 458 },
    { type: "position", id: 57 },
    { type: "transition", id: 1207 },
    { type: "position", id: 401 },
  ] as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts canonical frames from the admin endpoint", async () => {
    const request = createMockRequest("POST", "https://example.com/api/admin/grapplemap-extract", {
      body: { sequence: PREDEFINED_SEQUENCES.uchimata },
    });

    const response = await extractHandler({ request, env: { DB: {} as D1Database, GRAPPLEMAP_TEXT: grapplemapText } });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.meta.totalFrames).toBeGreaterThan(0);
    expect(data.markers).toHaveLength(PREDEFINED_SEQUENCES.uchimata.length);
    expect(data.frames.length).toBe(data.meta.totalFrames);
  });

  it("extracts editor-style graph node positions without dropping continuation nodes", async () => {
    const request = createMockRequest("POST", "https://example.com/api/admin/grapplemap-extract", {
      body: { sequence: doubleLegSpec },
    });

    const response = await extractHandler({ request, env: { DB: {} as D1Database, GRAPPLEMAP_TEXT: grapplemapText } });
    const data = await parseJsonResponse(response);

    expect(response.status).toBe(200);
    expect(data.markers).toHaveLength(doubleLegSpec.length);
    expect(data.frames.length).toBeGreaterThan(doubleLegSpec.length);
    expect(data.markers[4]?.name).toBe("(unnamed)");
    expect(data.markers[10]?.name).toBe("(unnamed)");
  });

  it("regenerates canonical frames on save instead of trusting submitted frames", async () => {
    const writes: { markersJson?: string; framesJson?: string; rowId?: string; rowSlug?: string } = {};

    const db = {
      prepare(query: string) {
        if (query.includes("CREATE TABLE IF NOT EXISTS technique_sequences")) {
          return { run: vi.fn().mockResolvedValue({ success: true }) };
        }

        if (query.includes("INSERT INTO technique_sequences")) {
          return {
            bind: vi.fn().mockImplementation((...args: unknown[]) => {
              writes.rowId = String(args[0]);
              writes.rowSlug = String(args[1]);
              writes.markersJson = String(args[8]);
              writes.framesJson = String(args[9]);
              return {
                run: vi.fn().mockResolvedValue({ success: true }),
              };
            }),
          };
        }

        if (query.includes("SELECT * FROM technique_sequences WHERE id = ? LIMIT 1")) {
          return {
            bind: vi.fn().mockReturnValue({
              first: vi.fn().mockImplementation(async () => ({
                id: writes.rowId,
                slug: writes.rowSlug,
                name: "Uchi Mata Admin Save",
                position_category: "standing",
                starting_position: "",
                ending_position: "",
                difficulty: "intermediate",
                description_json: JSON.stringify(["Uchi Mata Admin Save is part of the Sunnah Skills techniques library."]),
                markers_json: writes.markersJson ?? "[]",
                frames_json: writes.framesJson ?? "[]",
                sources_json: JSON.stringify(["Sunnah Skills Admin", { grapplemapExtractSpec: PREDEFINED_SEQUENCES.uchimata }]),
                verified: 0,
                created_at: "2026-03-30 00:00:00",
                updated_at: "2026-03-30 00:00:00",
              })),
            }),
          };
        }

        throw new Error(`Unexpected query: ${query}`);
      },
    } as unknown as D1Database;

    const bogusFrames = [[[[999, 999, 999]]]];
    const request = createMockRequest("POST", "https://example.com/api/admin/sequences", {
      body: {
        id: "uchi-mata-admin-save",
        meta: {
          id: "uchi-mata-admin-save",
          name: "Uchi Mata Admin Save",
          slug: "uchi-mata-admin-save",
          positionCategory: "standing",
          difficulty: "intermediate",
          description: ["Uchi Mata Admin Save is part of the Sunnah Skills techniques library."],
          sources: ["Sunnah Skills Admin"],
          grapplemapExtractSpec: PREDEFINED_SEQUENCES.uchimata,
        },
        markers: PREDEFINED_SEQUENCES.uchimata.map((step, index) => ({
          name: `placeholder-${index}`,
          frame: index,
          type: step.type,
          libraryType: step.type,
          flatId: step.id,
        })),
        frames: bogusFrames,
        verified: false,
      },
    });

    const response = await saveSequenceHandler({ request, env: { DB: db, GRAPPLEMAP_TEXT: grapplemapText } });
    const data = await parseJsonResponse(response);

    const savedFrames = JSON.parse(writes.framesJson ?? "[]") as number[][][][];
    const savedMarkers = JSON.parse(writes.markersJson ?? "[]") as Array<{ name: string; frame: number; type: string }>;

    expect(response.status).toBe(200);
    expect(savedFrames).not.toEqual(bogusFrames);
    expect(savedFrames.length).toBeGreaterThan(PREDEFINED_SEQUENCES.uchimata.length);
    expect(savedMarkers).toHaveLength(PREDEFINED_SEQUENCES.uchimata.length);
    expect(savedMarkers[0]?.name).not.toBe("placeholder-0");
    expect(data.sequence?.frames?.length).toBe(savedFrames.length);
  });
});
