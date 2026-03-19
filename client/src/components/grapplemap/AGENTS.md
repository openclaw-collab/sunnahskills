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
| `grapplemapScene.tsx` | Alternative skeleton view (currently unused) |

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

**Source**: `public/data/sequence.json`

```typescript
{
  meta: { name, extractedAt, totalFrames, positions, transitions },
  markers: [{ name, frame, type }], // type: "position" | "transition"
  frames: number[][][][] // frames[frame][player][joint][x,y,z]
}
```

- 23 joints per player
- 37 frames in current sequence
- Joints: toes, heels, ankles, knees, hips, shoulders, elbows, wrists, hands, fingers, core, neck, head

## Current Sequence

"Uchi-mata → Armbar → Tap" - collar tie → throw finish → armbar → staredown

## For AI Agents

### Working In This Directory
- Uses Three.js + @react-three/fiber
- Fetches sequence.json at runtime
- Auto-plays animation loop
- Supports manual orbit controls (drag to rotate)

### Performance Notes
- Memoize geometry calculations
- Use useFrame for animation updates
- Dispose geometries on unmount
- Limit to one active viewer per page

### Future Enhancements (see docs/technique-library.md)
- Playback controls (play/pause, scrubber)
- Multiple sequence support
- Scene selection grid
- Fullscreen mode

<!-- MANUAL: -->
