/**
 * Rebuild technique seed JSON using the canonical GrappleMap extractor module.
 *
 * Run: npx tsx scripts/extract-technique-seeds.ts
 * Then: node scripts/generate-technique-seed-sql.mjs
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSequenceFromGrappleMapText,
  PREDEFINED_SEQUENCES,
  serializeGraphPathSpec,
  type FlatSpecItem,
} from "../shared/grapplemapFlatSequence.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedDir = join(root, "db", "seeds", "techniques");
const grappleRoot = join(root, "GrappleMap");
const txtPath = join(grappleRoot, "GrappleMap.txt");
const grapplemapText = existsSync(txtPath) ? readFileSync(txtPath, "utf8") : "";

/** Same chain as GrappleMap preview preset (full throw -> armbar -> tap). */
const UCHIMATA_DEMO_SPEC: FlatSpecItem[] = PREDEFINED_SEQUENCES.uchimata;

const SLUG_PRESET: Record<string, FlatSpecItem[]> = {
  "uchi-mata": UCHIMATA_DEMO_SPEC,
};

type SeedMarker = {
  name?: string;
  frame?: number;
  type?: string;
  sourceId?: number;
  libraryType?: string;
};

function deriveSpec(data: Record<string, unknown>, slug: string, file: string): FlatSpecItem[] | null {
  if (SLUG_PRESET[slug]?.length) return SLUG_PRESET[slug];

  const existing = data.grapplemapExtractSpec;
  if (Array.isArray(existing) && existing.length > 0) {
    return existing as FlatSpecItem[];
  }
  const graphPathSpec = data.grapplemapPathSpec;
  if (Array.isArray(graphPathSpec) && graphPathSpec.length > 0) {
    return graphPathSpec as FlatSpecItem[];
  }

  const markers = [...((data.markers as SeedMarker[]) ?? [])].sort((a, b) => (a.frame ?? 0) - (b.frame ?? 0));
  const fromMarkers: FlatSpecItem[] = [];
  for (const m of markers) {
    if (m.libraryType === "note" || m.type === "note") continue;
    const id = m.sourceId;
    if (id == null || !Number.isFinite(id)) continue;
    const t = m.type === "position" || m.type === "transition" ? m.type : null;
    if (!t) continue;
    fromMarkers.push({ type: t, id: Number(id) });
  }
  if (fromMarkers.length > 0) return fromMarkers;

  const meta = (data.meta as Record<string, unknown>) ?? {};
  const tid = meta.transitionId;
  if (tid != null && Number.isFinite(Number(tid))) {
    return [{ type: "transition", id: Number(tid) }];
  }

  console.warn(`[extract-technique-seeds] Skip ${file}: no extract spec (add markers with sourceId, meta.transitionId, or grapplemapExtractSpec)`);
  return null;
}

function runExtractSequence(spec: FlatSpecItem[]): {
  frames: unknown[];
  markers: unknown[];
} {
  const raw = buildSequenceFromGrappleMapText(grapplemapText, spec) as unknown as Record<string, unknown>;
  return {
    frames: (raw.frames as unknown[]) ?? [],
    markers: (raw.markers as unknown[]) ?? [],
  };
}

function stripHeavyFields(data: Record<string, unknown>): void {
  delete data.skeleton;
}

if (!existsSync(txtPath)) {
  console.error("Missing GrappleMap/GrappleMap.txt");
  process.exit(1);
}
if (!existsSync(seedDir)) {
  console.error("Missing db/seeds/techniques");
  process.exit(1);
}

const files = readdirSync(seedDir).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const path = join(seedDir, file);
  const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  const meta = { ...((data.meta as object) ?? {}) } as Record<string, unknown>;
  const slug = String(meta.slug ?? file.replace(/\.json$/i, ""));

  const spec = deriveSpec(data, slug, file);
  if (!spec?.length) continue;

  const { frames, markers } = runExtractSequence(spec);
  if (!frames.length) {
    console.warn(`[extract-technique-seeds] ${file}: extract produced 0 frames`);
    continue;
  }

  meta.totalFrames = frames.length;
  meta.extractedAt = new Date().toISOString();
  if (meta.source == null) meta.source = "GrappleMap.txt";

  stripHeavyFields(data);
  data.meta = meta;
  data.frames = frames;
  data.markers = markers;
  data.grapplemapExtractSpec = spec;
  data.grapplemapPathSpec = spec;
  data.grapplemapPathString = serializeGraphPathSpec(spec);

  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`[extract-technique-seeds] ${file} → ${frames.length} frames, ${markers.length} markers`);
}

console.log("Done.");
