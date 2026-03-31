import { getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";
import {
  buildSequencePayloadFromGrappleMapText,
  serializeGraphPathSpec,
  type FlatSpecItem,
} from "../../../shared/grapplemapFlatSequence";
import grapplemapText from "../../lib/GrappleMap.txt";

interface Env {
  DB: D1Database;
  GRAPPLEMAP_TEXT?: string;
}

type Marker = {
  name: string;
  frame: number;
  type: "position" | "transition";
  positionId?: string;
  sourceId?: string;
  libraryType?: "position" | "transition" | "note";
  previewPath?: string;
  flatId?: number;
  graphNodeId?: number | null;
  graphTransitionId?: number | null;
  fromNodeId?: number | null;
  toNodeId?: number | null;
  family?: string;
  fromDisplayName?: string;
  toDisplayName?: string;
  reverse?: boolean;
};

type SequenceInput = {
  id?: string;
  meta: {
    id?: string;
    name: string;
    slug?: string;
    positionCategory: string;
    startingPosition?: string;
    endingPosition?: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    description: string[];
    sources?: string[];
    /** Legacy compatibility field for saved GrappleMap graph paths. */
    grapplemapExtractSpec?: FlatSpecItem[];
    /** Canonical saved graph path for replay/re-extract. */
    grapplemapPathSpec?: FlatSpecItem[];
    grapplemapPathString?: string;
    totalFrames?: number;
    positions?: number;
    transitions?: number;
  };
  markers: Marker[];
  frames: number[][][][];
  verified?: boolean;
};

type SequenceRow = {
  id: string;
  slug: string;
  name: string;
  position_category: string;
  starting_position: string | null;
  ending_position: string | null;
  difficulty: string | null;
  description_json: string | null;
  markers_json: string | null;
  frames_json: string | null;
  sources_json: string | null;
  verified: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function ensureSequenceTable(env: Env) {
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS technique_sequences (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      position_category TEXT NOT NULL,
      starting_position TEXT,
      ending_position TEXT,
      difficulty TEXT DEFAULT 'beginner',
      description_json TEXT DEFAULT '[]',
      markers_json TEXT DEFAULT '[]',
      frames_json TEXT DEFAULT '[]',
      sources_json TEXT DEFAULT '[]',
      verified INTEGER DEFAULT 0,
      created_by_admin_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `,
  ).run();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseJsonArray(value: string | null, fallback: unknown[] = []) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function parseGraphPathSpec(value: unknown): FlatSpecItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const spec = value.filter(
    (s): s is FlatSpecItem =>
      s != null &&
      typeof s === "object" &&
      ((s as FlatSpecItem).type === "position" || (s as FlatSpecItem).type === "transition") &&
      typeof (s as FlatSpecItem).id === "number" &&
      ((s as FlatSpecItem).reverse == null || typeof (s as FlatSpecItem).reverse === "boolean"),
  ) as FlatSpecItem[];
  return spec.length > 0 ? spec : undefined;
}

function normalizeGraphPathSpec(value: FlatSpecItem[] | undefined) {
  return value?.filter(
    (s) =>
      s &&
      (s.type === "position" || s.type === "transition") &&
      Number.isFinite(s.id) &&
      (s.reverse == null || typeof s.reverse === "boolean"),
  );
}

function parseSourcesRow(value: string | null): {
  stringSources: string[];
  grapplemapExtractSpec?: FlatSpecItem[];
  grapplemapPathSpec?: FlatSpecItem[];
  grapplemapPathString?: string;
} {
  const raw = parseJsonArray(value, []) as unknown[];
  const stringSources: string[] = [];
  let grapplemapExtractSpec: FlatSpecItem[] | undefined;
  let grapplemapPathSpec: FlatSpecItem[] | undefined;
  let grapplemapPathString: string | undefined;
  for (const item of raw) {
    if (typeof item === "string") stringSources.push(item);
    else if (item && typeof item === "object" && item !== null) {
      const sourceEntry = item as {
        grapplemapExtractSpec?: unknown;
        grapplemapPathSpec?: unknown;
        grapplemapPathString?: unknown;
      };
      grapplemapExtractSpec = parseGraphPathSpec(sourceEntry.grapplemapExtractSpec) ?? grapplemapExtractSpec;
      grapplemapPathSpec = parseGraphPathSpec(sourceEntry.grapplemapPathSpec) ?? grapplemapPathSpec;
      if (typeof sourceEntry.grapplemapPathString === "string" && sourceEntry.grapplemapPathString.trim()) {
        grapplemapPathString = sourceEntry.grapplemapPathString.trim();
      }
    }
  }
  return { stringSources, grapplemapExtractSpec, grapplemapPathSpec, grapplemapPathString };
}

function parseFrames(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapRow(row: SequenceRow) {
  const markers = parseJsonArray(row.markers_json) as Marker[];
  const description = parseJsonArray(row.description_json).filter((line): line is string => typeof line === "string");
  const { stringSources: sources, grapplemapExtractSpec, grapplemapPathSpec, grapplemapPathString } = parseSourcesRow(row.sources_json);

  return {
    id: row.id,
    meta: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      positionCategory: row.position_category,
      startingPosition: row.starting_position ?? "",
      endingPosition: row.ending_position ?? "",
      difficulty: (row.difficulty as "beginner" | "intermediate" | "advanced" | null) ?? "beginner",
      description,
      sources,
      ...(grapplemapPathSpec?.length ? { grapplemapPathSpec } : {}),
      ...(grapplemapPathString ? { grapplemapPathString } : {}),
      ...(grapplemapExtractSpec?.length ? { grapplemapExtractSpec } : {}),
      totalFrames: parseFrames(row.frames_json).length,
      positions: markers.filter((marker) => marker.type === "position").length,
      transitions: markers.filter((marker) => marker.type === "transition").length,
    },
    markers,
    frames: parseFrames(row.frames_json),
    verified: Boolean(row.verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateSequence(body: SequenceInput | null) {
  if (!body?.meta?.name?.trim()) return "Sequence name is required";
  if (!body.meta.positionCategory?.trim()) return "Position category is required";
  if (!Array.isArray(body.markers) || body.markers.length === 0) return "At least one marker is required";

  for (const marker of body.markers) {
    if (!marker?.name?.trim()) return "Each marker needs a label";
    if (!Number.isFinite(marker.frame) || marker.frame < 0) return "Marker frames must be non-negative numbers";
    if (marker.type !== "position" && marker.type !== "transition") return "Marker type must be position or transition";
  }

  return null;
}

function mergeMarkersWithCanonicalExtract(
  submittedMarkers: Marker[],
  canonicalMarkers: Marker[],
) {
  const nonNotes = submittedMarkers.filter((marker) => marker.libraryType !== "note");
  const notes = submittedMarkers.filter((marker) => marker.libraryType === "note");
  let cursor = 0;

  const merged = nonNotes
    .map((marker) => {
      const extracted = canonicalMarkers[cursor++];
      if (!extracted) return null;
      return {
        ...marker,
        name: extracted.name,
        frame: extracted.frame,
        type: extracted.type,
      } satisfies Marker;
    })
    .filter((marker): marker is Marker => marker != null);

  const maxFrame = Math.max(0, canonicalMarkers[canonicalMarkers.length - 1]?.frame ?? 0);
  const normalizedNotes = notes.map((marker) => ({
    ...marker,
    frame: Math.max(0, Math.min(marker.frame, maxFrame)),
  }));

  return [...merged, ...normalizedNotes].sort((left, right) => left.frame - right.frame);
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "sequences", "read")) return json({ error: "Forbidden" }, { status: 403 });

  await ensureSequenceTable(env);

  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim();
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  let sql = `SELECT * FROM technique_sequences`;
  const conditions: string[] = [];
  const bindings: Array<string> = [];

  if (category) {
    conditions.push(`position_category = ?`);
    bindings.push(category);
  }

  if (q) {
    conditions.push(`(LOWER(name) LIKE ? OR LOWER(slug) LIKE ?)`);
    bindings.push(`%${q}%`, `%${q}%`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += ` ORDER BY updated_at DESC, name ASC`;

  const rows = (await env.DB.prepare(sql).bind(...bindings).all()).results as SequenceRow[] | undefined;
  return json({ sequences: (rows ?? []).map(mapRow) });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "sequences", "write")) return json({ error: "Forbidden" }, { status: 403 });

  await ensureSequenceTable(env);

  const body = (await request.json().catch(() => null)) as SequenceInput | null;
  const validationError = validateSequence(body);
  if (validationError) {
    return json({ error: validationError }, { status: 400 });
  }

  const markers = [...(body?.markers ?? [])].sort((left, right) => left.frame - right.frame);
  const slug = slugify(body?.meta.slug?.trim() || body?.meta.name || body?.id || body?.meta.id || "");
  const id = body?.id?.trim() || body?.meta.id?.trim() || slug;
  const description = (body?.meta.description ?? []).map((line) => line.trim()).filter(Boolean);
  const stringSources = (body?.meta.sources ?? []).map((line) => String(line).trim()).filter(Boolean);
  const spec = normalizeGraphPathSpec(body?.meta.grapplemapExtractSpec);
  const canonicalPathSpec = normalizeGraphPathSpec(body?.meta.grapplemapPathSpec) ?? spec;
  const sourcesPayload: unknown[] = [...stringSources];
  if (canonicalPathSpec && canonicalPathSpec.length > 0) {
    sourcesPayload.push({
      grapplemapPathSpec: canonicalPathSpec,
      grapplemapPathString: serializeGraphPathSpec(canonicalPathSpec),
      grapplemapExtractSpec: canonicalPathSpec,
    });
  }
  let persistedMarkers = markers;
  let persistedFrames = body?.frames ?? [];

  if (canonicalPathSpec && canonicalPathSpec.length > 0) {
    const grapplemapSource =
      typeof grapplemapText === "string" && grapplemapText.length >= 1000 ? grapplemapText : env.GRAPPLEMAP_TEXT;
    if (!grapplemapSource || typeof grapplemapSource !== "string" || grapplemapSource.length < 1000) {
      return json({ error: "GrappleMap.txt not bundled on the admin runtime" }, { status: 500 });
    }

    const canonical = buildSequencePayloadFromGrappleMapText(body?.meta.name.trim(), grapplemapSource, canonicalPathSpec);
    persistedFrames = canonical.frames;
    persistedMarkers = mergeMarkersWithCanonicalExtract(markers, canonical.markers);
  }

  const firstPosition =
    persistedMarkers.find((marker) => marker.type === "position")?.name ?? persistedMarkers[0]?.name ?? "";
  const lastPosition =
    [...persistedMarkers].reverse().find((marker) => marker.type === "position")?.name ??
    persistedMarkers[persistedMarkers.length - 1]?.name ??
    "";

  await env.DB.prepare(
    `
    INSERT INTO technique_sequences (
      id,
      slug,
      name,
      position_category,
      starting_position,
      ending_position,
      difficulty,
      description_json,
      markers_json,
      frames_json,
      sources_json,
      verified,
      created_by_admin_user_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      position_category = excluded.position_category,
      starting_position = excluded.starting_position,
      ending_position = excluded.ending_position,
      difficulty = excluded.difficulty,
      description_json = excluded.description_json,
      markers_json = excluded.markers_json,
      frames_json = excluded.frames_json,
      sources_json = excluded.sources_json,
      verified = excluded.verified,
      updated_at = datetime('now')
    `,
  )
    .bind(
      id,
      slug,
      body?.meta.name.trim(),
      body?.meta.positionCategory.trim(),
      body?.meta.startingPosition?.trim() || firstPosition,
      body?.meta.endingPosition?.trim() || lastPosition,
      body?.meta.difficulty ?? "beginner",
      JSON.stringify(description),
      JSON.stringify(persistedMarkers),
      JSON.stringify(persistedFrames),
      JSON.stringify(sourcesPayload),
      body?.verified ? 1 : 0,
      admin.adminUserId,
    )
    .run();

  const row = (await env.DB.prepare(`SELECT * FROM technique_sequences WHERE id = ? LIMIT 1`).bind(id).first()) as SequenceRow | null;
  return json({ ok: true, sequence: row ? mapRow(row) : null });
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  await ensureSequenceTable(env);

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) return json({ error: "id is required" }, { status: 400 });

  await env.DB.prepare(`DELETE FROM technique_sequences WHERE id = ? OR slug = ?`).bind(id, id).run();
  return json({ ok: true });
}
