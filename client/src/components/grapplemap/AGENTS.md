<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# grapplemap

## Purpose
3D grappling technique visualization using Three.js and @react-three/fiber. Displays animated stick-figure sequences (attacker + defender).

## Key Files

| File | Description |
|------|-------------|
| `TechniqueViewer.tsx` | Wrapper: Suspense + MannequinViewer |
| `MannequinScene.tsx` | Main 3D scene with Canvas, OrbitControls, HumanPlayer |
| `grapplemapScene.tsx` | Legacy skeleton view / default fallback scene |

## Component Hierarchy

```
TechniqueViewer (page/section wrapper)
  └── Suspense
        └── MannequinViewer
              └── MannequinSceneInner
                    ├── Canvas (Three.js)
                    ├── OrbitControls (auto-rotate)
                    ├── HumanPlayer (attacker)
                    ├── HumanPlayer (defender)
                    ├── Grid / lighting
                    └── Animation loop
```

## Data Format

**Primary sources**: `public/data/library/sequences/manifest.json` and `public/data/library/sequences/*.json`
**Legacy fallback**: `public/data/sequence.json`

Primary library sequence format:
```typescript
{
  meta: {
    id: string;
    name: string;
    slug: string;
    positionCategory: string;
    startingPosition: string;
    endingPosition: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    description: string[];
    sources?: string[];
    totalFrames: number;
    positions: number;
    transitions: number;
  },
  markers: [{ name, frame, type }], // type: "position" | "transition"
  frames: number[][][][],
  verified: boolean
}
```

Legacy fallback format:
```typescript
{
  meta: { name, extractedAt, totalFrames, positions, transitions },
  markers: [{ name, frame, type }],
  frames: number[][][][]
}
```

- 23 joints per player
- Frames are `frames[frame][player][joint][x,y,z]`
- Player 0 = attacker, player 1 = defender

## Current Sequence

"Uchi-mata → Armbar → Tap" - collar tie → throw finish → armbar → staredown

## For AI Agents

### Working In This Directory
- Uses Three.js + @react-three/fiber
- Fetches `sequencePath` at runtime (defaults to `/data/sequence.json`)
- Auto-plays animation loop
- Supports manual orbit controls (drag to rotate)

### Performance Notes
- Memoize geometry calculations
- Use useFrame for animation updates
- Dispose geometries on unmount
- Limit to one active viewer per page

### Future Enhancements (see docs/technique-library.md)
- Playback controls (play/pause, scrubber)
- Multiple sequence support via the library manifest
- Scene selection grid
- Fullscreen mode

<!-- MANUAL: -->
