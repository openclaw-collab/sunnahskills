<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# data

## Purpose
GrappleMap 3D animation data files. JSON sequences for the technique viewer.

## Key Files

| File | Description |
|------|-------------|
| `sequence.json` | Current sequence: "Uchi-mata → Armbar → Tap" (37 frames) |
| `scenes.json` | Unused catalog metadata (potential future use) |

## sequence.json Format

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

### Future Enhancement
- Support multiple `.json` files
- Create manifest indexing all sequences
- Add metadata (tags, difficulty, description)

<!-- MANUAL: -->
