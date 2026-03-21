<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# data

## Purpose
GrappleMap 3D animation data files, catalogs, and manifests used by the technique viewer and admin sequence tools.

## Key Files

| File | Description |
|------|-------------|
| `sequence.json` | Legacy single-sequence fallback used by the default viewer path |
| `scenes.json` | Technique card catalog for the `/techniques` page |
| `library/admin/positions.json` | Admin positions catalog |
| `library/sequences/manifest.json` | Library sequence index |
| `library/sequences/*.json` | Individual technique sequences |

## Legacy `sequence.json` Format

```typescript
{
  meta: {
    name: string;
    extractedAt: string;
    totalFrames: number;
    positions: string[];
    transitions: string[];
  },
  markers: [{ name: string; frame: number; type: "position" | "transition" }],
  frames: number[][][][] // frames[frame][player][joint][x,y,z]
}
```

- 23 joints per player (toes, heels, ankles, knees, hips, shoulders, elbows, wrists, hands, fingers, core, neck, head)
- 2 players (attacker, defender)
- 37 frames in current sequence

## For AI Agents

### Working In This Directory
- Data generated from GrappleMap project
- Fetch at runtime from `/data/sequence.json`
- Keep files under 1MB for performance
- Multiple sequences require manifest/catalog

### Current Enhancement
- Keep `scenes.json` and `library/sequences/manifest.json` in sync with any new GrappleMap export
- Add metadata (tags, difficulty, description) to new sequences

<!-- MANUAL: -->
