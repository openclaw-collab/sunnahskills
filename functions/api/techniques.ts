interface Env {
  DB?: D1Database;
}

type Marker = {
  name: string;
  frame: number;
  type: "position" | "transition";
  positionId?: string;
  sourceId?: string;
  libraryType?: "position" | "transition" | "note";
  previewPath?: string;
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
  if (!env.DB) return;
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

function parseJsonArray<T>(value: string | null, fallback: T[] = []) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function parseFrames(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapSequenceRow(row: SequenceRow) {
  const markers = parseJsonArray<Marker>(row.markers_json);
  const frames = parseFrames(row.frames_json);
  const description = parseJsonArray<string>(row.description_json).filter((line) => typeof line === "string");
  const sources = parseJsonArray<string>(row.sources_json).filter((line) => typeof line === "string");

  return {
    id: row.id,
    meta: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      positionCategory: row.position_category,
      startingPosition: row.starting_position ?? "",
      endingPosition: row.ending_position ?? "",
      difficulty: (row.difficulty as "beginner" | "intermediate" | "advanced" | null) ?? "beginner",
      description,
      sources,
      totalFrames: frames.length,
      dataPath: `/api/techniques?id=${encodeURIComponent(row.id)}`,
    },
    markers,
    frames,
    verified: Boolean(row.verified),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ techniques: [] });

  await ensureSequenceTable(env);

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  if (id) {
    const row = (await env.DB.prepare(
      `SELECT * FROM technique_sequences WHERE verified = 1 AND (id = ? OR slug = ?) LIMIT 1`,
    )
      .bind(id, id)
      .first()) as SequenceRow | null;

    if (!row) {
      return json({ error: "Technique not found" }, { status: 404 });
    }

    const sequence = mapSequenceRow(row);
    return json({
      meta: sequence.meta,
      markers: sequence.markers,
      frames: sequence.frames,
    });
  }

  const rows = (await env.DB.prepare(
    `SELECT * FROM technique_sequences WHERE verified = 1 ORDER BY updated_at DESC, name ASC`,
  ).all()).results as SequenceRow[] | undefined;

  return json({
    techniques: (rows ?? []).map(mapSequenceRow).map((sequence) => ({
      id: sequence.id,
      meta: sequence.meta,
      verified: sequence.verified,
      createdAt: sequence.createdAt,
      updatedAt: sequence.updatedAt,
    })),
  });
}
