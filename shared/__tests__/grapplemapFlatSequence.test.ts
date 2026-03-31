import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadGraph } from "../../GrappleMap/scripts/grapplemap-loader.js";
import {
  buildSequenceFromGrappleMapText,
  buildSequencePayloadFromGrappleMapText,
  parseFlatSpec,
  PREDEFINED_SEQUENCES,
  serializeGraphPathSpec,
} from "../grapplemapFlatSequence";

const repoRoot = join(__dirname, "..", "..");
const grapplemapPath = join(repoRoot, "GrappleMap", "GrappleMap.txt");
const grapplemapText = readFileSync(grapplemapPath, "utf8");
const uchimataSpec = PREDEFINED_SEQUENCES.uchimata;
const uchimataCanonical = buildSequenceFromGrappleMapText(grapplemapText, uchimataSpec);
const uchimataPayload = buildSequencePayloadFromGrappleMapText(
  "uchimata",
  grapplemapText,
  uchimataSpec,
  "2026-03-30T00:00:00.000Z",
);
const uchimataLoader = loadGraph(grapplemapPath).buildSequence(uchimataSpec);

describe("grapplemapFlatSequence", () => {
  it("round-trips reverse transitions in the canonical path format", () => {
    const spec = [
      { type: "position", id: 21 },
      { type: "transition", id: 485, reverse: true },
      { type: "position", id: 46 },
    ] as const;

    const serialized = serializeGraphPathSpec([...spec]);

    expect(serialized).toBe("p21, t485r, p46");
    expect(parseFlatSpec(serialized)).toEqual(spec);
    expect(parseFlatSpec("p21, -485, p46")).toEqual(spec);
  });

  it("extracts reverse graph transitions without dropping direction", () => {
    const spec = [
      { type: "position", id: 21 },
      { type: "transition", id: 485, reverse: true },
      { type: "position", id: 46 },
    ] as const;

    const canonical = buildSequenceFromGrappleMapText(grapplemapText, [...spec]);

    expect(canonical.markers).toEqual([
      { name: "standing vs\\nde la riva", frame: 0, type: "position" },
      { name: "reverse", frame: 0, type: "transition" },
      { name: "standing vs\\nreverse dlr", frame: 3, type: "position" },
    ]);
    expect(canonical.frames).toHaveLength(4);
  });

  it("supports editor-style graph node ids for the long double-leg chain", () => {
    const spec = [
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

    const canonical = buildSequenceFromGrappleMapText(grapplemapText, [...spec]);

    expect(canonical.markers).toHaveLength(spec.length);
    expect(canonical.frames.length).toBeGreaterThan(spec.length);
    expect(canonical.markers[4]?.name).toBe("(unnamed)");
    expect(canonical.markers[10]?.name).toBe("(unnamed)");
    expect(canonical.markers[0]?.name).toBe("staredown");
    expect(canonical.markers.at(-1)?.name).toBe("staredown");
  });

  it("matches GrappleMap loader output for the uchimata preset", () => {
    expect(uchimataCanonical.markers).toEqual(uchimataLoader.markers);
    expect(uchimataCanonical.frames).toEqual(uchimataLoader.frames);
  });

  it("builds payload metadata from the same canonical extraction", () => {
    expect(uchimataPayload.meta).toEqual({
      name: "uchimata",
      extractedAt: "2026-03-30T00:00:00.000Z",
      totalFrames: uchimataPayload.frames.length,
      positions: uchimataSpec.filter((step) => step.type === "position").length,
      transitions: uchimataSpec.filter((step) => step.type === "transition").length,
    });
    expect(uchimataPayload.markers).toHaveLength(uchimataSpec.length);
    expect(uchimataPayload.frames.length).toBeGreaterThan(uchimataSpec.length);
  });
});
