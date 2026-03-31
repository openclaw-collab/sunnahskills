import type { TechniqueSequence } from "@/lib/grapplemap-types";

/**
 * Loads verified technique sequences from D1 via GET /api/techniques (no static bundle JSON).
 * Returns empty array when the API is unavailable (e.g. Vite without wrangler).
 */
export async function loadLibrarySequences(): Promise<TechniqueSequence[]> {
  try {
    const res = await fetch("/api/techniques");
    if (!res.ok) return [];

    const data = (await res.json()) as {
      techniques?: Array<{
        id: string;
        meta: {
          slug: string;
          name: string;
          positionCategory: string;
          startingPosition?: string;
          endingPosition?: string;
          difficulty?: "beginner" | "intermediate" | "advanced";
          description?: string[];
          sources?: string[];
        };
      }>;
    };

    const rows = data.techniques ?? [];
    const out: TechniqueSequence[] = [];

    for (const row of rows) {
      const detailRes = await fetch(`/api/techniques?id=${encodeURIComponent(row.id)}`);
      if (!detailRes.ok) continue;
      const detail = (await detailRes.json()) as {
        meta?: { name?: string; slug?: string; positionCategory?: string; startingPosition?: string; endingPosition?: string; difficulty?: string; description?: string[]; sources?: string[] };
        markers?: TechniqueSequence["markers"];
        frames?: TechniqueSequence["frames"];
      };

      const meta = detail.meta ?? row.meta;
      out.push({
        id: row.id,
        name: meta.name ?? row.meta.name,
        slug: meta.slug ?? row.meta.slug,
        positionCategory: meta.positionCategory as TechniqueSequence["positionCategory"],
        startingPosition: meta.startingPosition ?? row.meta.startingPosition ?? "",
        endingPosition: meta.endingPosition ?? row.meta.endingPosition ?? "",
        markers: detail.markers ?? [],
        frames: detail.frames ?? [],
        description: Array.isArray(meta.description) ? meta.description : row.meta.description ?? [],
        difficulty: (meta.difficulty as TechniqueSequence["difficulty"]) ?? row.meta.difficulty ?? "beginner",
        sources: meta.sources ?? row.meta.sources,
      });
    }

    return out;
  } catch {
    return [];
  }
}
