<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# GrappleMap

## Purpose
Vendored **GrappleMap** project: source, scripts, and **`GrappleMap.txt`** for BJJ positions/transitions. Lives in the Sunnah Skills repo at **`GrappleMap/`**. Do not commit `preview/node_modules`, `**/dist`, or `.playwright-mcp/` (see `GrappleMap/.gitignore`).

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
- Has its own preview app (`preview/`, run `npm install` there if needed)
- Pipeline output is consumed as JSON under **`client/public/data/`** (not the whole C++ tree)
- See **`docs/technique-library.md`** for integration and extraction scripts

### Integration
1. Extract sequences from GrappleMap
2. Convert to `sequence.json` format
3. Place in `client/public/data/`
4. Reference from `MannequinScene.tsx`

<!-- MANUAL: -->
