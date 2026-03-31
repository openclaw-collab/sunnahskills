# Design: Graph-Connected Sequence Builder

**Date:** 2026-03-30  
**Scope:** Refactor AdminSequences.tsx to expose full GrappleMap graph connectivity

---

## Overview

Rebuild the sequence builder behavior to properly expose the GrappleMap graph structure. Instead of a curated starting position list, provide full search across ~1600+ positions, with context-aware "next moves" based on actual graph connectivity.

---

## Current State

AdminSequences.tsx has partial graph visibility:
- Shows some graph-connected transitions in the composer
- Loads positions.json, transitions.json, graph-links.json
- Uses TechniqueViewer for preview

Remaining gaps:
- Starting positions may still be filtered/curated rather than full ~1600+ searchable list
- Path export not canonical: `grapplemapPathSpec` not saved as primary field
- Timeline insertion controls (if present) may allow graph-disconnected insertions

---

## Target State

### Data Sources (already loaded)

- `positions.json` — ~1600+ graph positions
- `transitions.json` — transition metadata
- `graph-links.json` — node connectivity (incoming/outgoing edges)

### Left Panel: Position Search

- Full searchable list of all positions from `positions.json`
- Filter by name, tags, description
- Click any position to start a new sequence

### Center: Sequence Timeline

- Visual strip showing the current chain
- Positions and transitions in order
- Insert before/after controls per slot **(graph-constrained: only transitions valid per graph-links.json relative to the adjacent node)**
- Remove step control
- Debug path string display (e.g., `p96 → t337 → p97`) — visible, not interactive

### Right Panel: Context-Aware Suggestions

- **Default anchor:** Current chain start/end (not manual selection)
- **Before** — shows all incoming transitions to the chain's first position
- **After** — shows all outgoing transitions from the chain's last position
- Each suggestion: transition name, connected position, click to prepend/append
- Visual feedback for disconnected chain (edge case handling)

### Extraction & Storage

- Canonical extraction via `buildSequencePayloadFromGrappleMapText`
- Save `grapplemapPathSpec` as primary field
- Maintain backward compatibility: read `grapplemapExtractSpec` if `grapplemapPathSpec` absent
- Pass extracted payload to TechniqueViewer for preview

---

## Key Files

### `client/src/pages/admin/AdminSequences.tsx`

- Full start-position search (replace hardcoded list)
- Graph-connected before/after suggestions
- Timeline with path-string display
- Save/load via `grapplemapPathSpec`

### `shared/grapplemapFlatSequence.ts`

- Canonical extraction + path serialization
- Explicit contract: `FlatSpecItem[]` type and `serializeGraphPathSpec()` for path string conversion
- Ensure path format logic stays centralized (not scattered across admin/functions/scripts)

### `functions/api/admin/sequences.ts`

- Persist `grapplemapPathSpec` as canonical
- Keep backward compatibility with `grapplemapExtractSpec`

---

## Renderer

TechniqueViewer.tsx — already integrated, continues receiving canonical extracted payload.

---

## Success Criteria

1. All ~1600+ positions searchable as starting points
2. Before/After suggestions filtered by real graph connectivity
3. Saved sequences include canonical `grapplemapPathSpec`
4. Preview renders via TechniqueViewer identically to technique library
5. Backward compatibility: existing `grapplemapExtractSpec` sequences still load
