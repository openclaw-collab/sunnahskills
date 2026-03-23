<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# GrappleMap

## Purpose
External GrappleMap project for 3D grappling technique visualization. Gitignored from main repo but present for data generation.

## Structure

| Directory | Purpose |
|-----------|---------|
| `preview/` | Vite preview application |
| `drills/` | `.script` files for technique sequences |
| `doc/` | GrappleMap documentation |
| `blender/` | Blender-related files |
| `components/` | Shared components |
| `scripts/` | Data processing scripts |
| `proofs/` | Proof-of-concept code |

## Key Files

| File | Description |
|------|-------------|
| `GrappleMap.txt` | ~2.6MB plain-text database of positions and transitions |
| `README.md` | GrappleMap project overview |

## Data Flow

```
GrappleMap.txt (source database)
  └── Scripts/process
        └── JSON output
              └── client/public/data/sequence.json
```

## For AI Agents

### Working In This Directory
- Separate project with its own build system
- Generates data for Sunnah Skills technique library
- Not directly deployed - output is copied to `client/public/data/`
- See `docs/technique-library.md` for integration details

### Integration
1. Extract sequences from GrappleMap
2. Convert to `sequence.json` format
3. Place in `client/public/data/`
4. Reference from `MannequinScene.tsx`

<!-- MANUAL: -->
