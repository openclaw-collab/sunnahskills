import { getAdminFromRequest } from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

interface Position {
  id: string;
  name: string;
  displayName?: string;
  tags: string[];
  frameCount: number;
}

interface PositionsOutput {
  meta: {
    extractedAt: string;
    source: string;
    positionCount: number;
  };
  positions: Position[];
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function summarizePositionName(name: string) {
  const lines = name
    .split("\\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(-3).join(" / ") || name;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  const tag = url.searchParams.get("tag") || "";
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    // Fetch static JSON from the same origin (served as a static asset)
    const dataUrl = new URL("/data/library/admin/positions.json", url.origin);
    const res = await fetch(dataUrl.toString());
    if (!res.ok) throw new Error(`Failed to fetch positions: ${res.status}`);
    const data: PositionsOutput = await res.json();

    let filtered = data.positions.map((position) => ({
      ...position,
      displayName: summarizePositionName(position.name),
    }));

    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.displayName?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (tag) {
      filtered = filtered.filter((p) => p.tags.includes(tag));
    }

    const total = filtered.length;
    filtered = filtered.slice(offset, offset + limit);

    return json({ positions: filtered, total, limit, offset });
  } catch (e) {
    console.error("Error loading positions:", e);
    return json({ error: "Failed to load positions" }, { status: 500 });
  }
}
