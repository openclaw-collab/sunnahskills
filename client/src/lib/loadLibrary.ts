import { TechniqueSequence } from "./grapplemap-types";

export async function loadLibrarySequences(): Promise<TechniqueSequence[]> {
  try {
    const res = await fetch("/data/library/sequences/manifest.json");
    if (res.ok) {
      const data = await res.json();
      return data.sequences || [];
    }
  } catch {}
  
  const sequences: TechniqueSequence[] = [];
  const slugs = [
    "scissor-sweep",
    "elevator-sweep",
    "bullfighter-pass",
    "leg-over-pass",
    "double-leg-takedown",
    "guard-pull",
    "cross-collar-choke",
    "armbar-from-mount",
  ];
  
  for (const slug of slugs) {
    try {
      const res = await fetch(`/data/library/sequences/${slug}.json`);
      if (res.ok) {
        const data = await res.json();
        sequences.push({
          id: data.meta.id,
          name: data.meta.name,
          slug: data.meta.slug,
          positionCategory: data.meta.positionCategory,
          startingPosition: data.meta.startingPosition,
          endingPosition: data.meta.endingPosition,
          markers: data.markers,
          frames: data.frames || [],
          description: data.meta.description || [],
          difficulty: data.meta.difficulty || "beginner",
          sources: data.meta.sources,
        });
      }
    } catch {}
  }
  
  return sequences;
}
