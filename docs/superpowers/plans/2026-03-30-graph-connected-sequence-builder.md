# Graph-Connected Sequence Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AdminSequences.tsx expose full graph connectivity with searchable start positions, canonical path export, and debug path string display.

**Architecture:** Modify existing AdminSequences.tsx to show all searchable starting positions, keep a separate graph-expandable pool for random drills, ensure `grapplemapPathSpec` is the primary saved field, and add timeline path string visualization derived from the canonical saved spec.

**Tech Stack:** React, TypeScript, existing GrappleMap graph data (positions.json, graph-links.json, transitions.json)

---

## File Structure

| File | Responsibility |
|------|----------------|
| `client/src/pages/admin/AdminSequences.tsx` | Main admin sequences editor UI - modified to remove position filtering, add path string display |
| `shared/grapplemapFlatSequence.ts` | Path serialization utilities and shared `FlatSpecItem` type - source of truth for canonical path serialization |
| `functions/api/admin/sequences.ts` | Already saves `grapplemapPathSpec` - verify backward compatibility |

---

## Task 1: Broaden Searchable Starts Without Breaking Random Drill

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx:818-853`

**Context:** The `graphStartingPositions` selector currently filters out positions with zero routes. The spec requires ALL ~1600+ positions to be searchable as starting points, but random drills should still start from positions that can expand forward.

- [ ] **Step 1: Locate the graphStartingPositions selector**

Find this code around line 818:
```typescript
const graphStartingPositions = useMemo(() => {
  const needle = startSearchQuery.trim().toLowerCase();
  return [...positions]
    .filter((item) => item.graphNodeId != null)
    .filter((item) => {
      const graphNodeId = item.graphNodeId as number;
      const routeCount =
        (outgoingTransitionsByNode.get(graphNodeId)?.length ?? 0) + (incomingTransitionsByNode.get(graphNodeId)?.length ?? 0);
      if (routeCount === 0) return false;  // <-- REMOVE THIS FILTER
      if (!needle) return true;
      // ...search logic
```

- [ ] **Step 2: Remove the route count filter for searchable starts**

Edit to remove the routeCount check:
```typescript
const graphStartingPositions = useMemo(() => {
  const needle = startSearchQuery.trim().toLowerCase();
  return [...positions]
    .filter((item) => item.graphNodeId != null)
    .filter((item) => {
      if (!needle) return true;
      const searchable = [
        item.name,
        item.displayName,
        item.slug,
        item.family,
        ...(item.searchTerms ?? []),
        ...item.tags,
        ...item.props,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(needle);
    })
    .sort((left, right) => getItemLabel(left).localeCompare(getItemLabel(right)));
}, [positions, startSearchQuery]);
```

- [ ] **Step 3: Add a separate `randomizableStartingPositions` memo**

```typescript
const randomizableStartingPositions = useMemo(
  () =>
    graphStartingPositions.filter((item) => {
      const nodeId = item.graphNodeId;
      return nodeId != null && (outgoingTransitionsByNode.get(nodeId)?.length ?? 0) > 0;
    }),
  [graphStartingPositions, outgoingTransitionsByNode],
);
```

Update `randomizeSequence` to use `randomizableStartingPositions`, not `graphStartingPositions`.

- [ ] **Step 4: Update the displayed count text**

Find line ~1457 showing the count and update:
```typescript
<div className="mt-3 text-xs text-charcoal/55">
  Showing {graphStartingPositions.length} positions.
</div>
```

- [ ] **Step 5: Verify the change**

Run dev server, navigate to Admin → Sequences → Start tab. Search for a position with no routes (if known) or verify count increased to ~1600+.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx
git commit -m "feat(admin): show all positions in sequence builder start tab"
```

---

## Task 2: Add Path String Display to Timeline

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx`

**Context:** The spec requires a debug path string display (e.g., `p96 → t337 → p97`) visible but not interactive. It should be derived from the same canonical spec we save, not reconstructed from mixed marker fields.

- [ ] **Step 1: Add pathString memo in component**

Find the component body (around line 360 where other useMemo hooks are) and add:

```typescript
const pathString = useMemo(() => {
  const spec = deriveExtractSpec(sequenceMarkers);
  return spec.length > 0 ? serializeGraphPathSpec(spec).replace(/, /g, " -> ") : "";
}, [sequenceMarkers]);
```

- [ ] **Step 2: Add path string display to timeline UI**

Find the timeline/review section (around line 1650 where sequence markers are rendered). Add a debug display:

```tsx
{pathString && (
  <div className="mb-4 rounded-xl border border-charcoal/10 bg-cream/35 p-3">
    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/50">
      Canonical path
    </div>
    <div className="mt-1 font-mono text-xs text-charcoal/80 break-all">
      {pathString}
    </div>
  </div>
)}
```

Place this above the sequence markers list in the "review" tab or timeline section.

- [ ] **Step 3: Verify the change**

Build a sequence with positions and transitions. Verify the path string displays correctly (e.g., `p96 → t337 → p97`).

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx
git commit -m "feat(admin): add canonical path string display to sequence timeline"
```

---

## Task 3: Verify grapplemapPathSpec is Primary Save Field

**Files:**
- Verify: `client/src/pages/admin/AdminSequences.tsx:1266-1269`
- Verify: `functions/api/admin/sequences.ts`

**Context:** The spec requires `grapplemapPathSpec` as the canonical saved field. Check current implementation already does this.

- [ ] **Step 1: Verify frontend saves grapplemapPathSpec**

Find `saveSequence` function around line 1190. Confirm it includes:

```typescript
grapplemapPathSpec: grapplemapExtractSpec,
grapplemapPathString: serializeGraphPathSpec(grapplemapExtractSpec),
```

This should already exist (from line 1266-1267 in the current file).

- [ ] **Step 2: Verify backend persists grapplemapPathSpec**

Check `functions/api/admin/sequences.ts` around line 265. Confirm the save logic includes `grapplemapPathSpec` in the sources payload.

- [ ] **Step 3: Verify backward compatibility on load**

Check AdminSequences.tsx around line 1180. Confirm the load logic prefers `grapplemapPathSpec` but falls back to `grapplemapExtractSpec`:

```typescript
const hydrated =
  (sequence.meta.grapplemapPathSpec?.length || sequence.meta.grapplemapExtractSpec?.length)
    ? buildMarkersFromExtractSpec(sequence.meta.grapplemapPathSpec ?? sequence.meta.grapplemapExtractSpec ?? [])
    : hydrateSavedMarkers(sequence.markers ?? []);
```

This should already exist.

- [ ] **Step 4: Test save/load cycle**

1. Create a new sequence
2. Add positions and transitions
3. Save
4. Reload the page
5. Load the saved sequence
6. Verify path string displays correctly

- [ ] **Step 5: Commit (if any changes made)**

If verification required no changes:
```bash
git commit --allow-empty -m "chore(admin): verify grapplemapPathSpec is canonical save field"
```

---

## Task 4: Update UI Text for Full Position List

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx:1437-1441`

**Context:** The Start tab subtitle mentions "graph-connected start" but now shows all positions.

- [ ] **Step 1: Update Start tab subtitle**

Find the Start tab content (around line 1437):

```tsx
<div className="mt-2 max-w-xl text-sm leading-relaxed text-charcoal/60">
  Choose any position from the full graph to begin your sequence. All ~1600+ positions are available.
</div>
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx
git commit -m "docs(admin): update sequence builder subtitle for full position list"
```

---

## Task 5: Make Shared FlatSpecItem Type Canonical

**Files:**
- Verify: `shared/grapplemapFlatSequence.ts`
- Verify: Type usage in AdminSequences.tsx

**Context:** Ensure `FlatSpecItem` type contract is explicit and imported from the shared module instead of duplicated locally.

- [ ] **Step 1: Verify FlatSpecItem export**

Confirm `shared/grapplemapFlatSequence.ts` exports:

```typescript
export type FlatSpecItem = { type: "position" | "transition"; id: number };
```

- [ ] **Step 2: Verify serializeGraphPathSpec export**

Confirm export exists:

```typescript
export function serializeGraphPathSpec(spec: GrappleMapGraphPathStep[]): string;
```

- [ ] **Step 3: Replace the local alias in AdminSequences.tsx**

Replace the local type alias with a shared import:

```typescript
import { serializeGraphPathSpec, type FlatSpecItem } from "@shared/grapplemapFlatSequence";
```

- [ ] **Step 4: Use `FlatSpecItem` throughout**

Update `grapplemapExtractSpec`, `grapplemapPathSpec`, `deriveExtractSpec`, `fetchCanonicalExtract`, and any helper signatures to use `FlatSpecItem` directly.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx
# or if no changes:
git commit --allow-empty -m "chore(types): verify FlatSpecItem contract for path serialization"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All items from spec have corresponding tasks
  - Full searchable positions → Task 1
  - Path string display → Task 2
  - grapplemapPathSpec canonical → Task 3
  - Type contract explicit → Task 5

- [ ] **Placeholder scan:** No "TBD", "TODO", "implement later", or vague instructions

- [ ] **Type consistency:** All types referenced match between tasks
  - `SequenceMarker` used consistently
  - shared `FlatSpecItem` used directly
  - `serializeGraphPathSpec` signature correct

---

## Execution Handoff

Plan complete. Two execution options:

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task using `superpowers:subagent-driven-development`

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`

After all tasks complete, verify:
1. All ~1600+ positions searchable in Start tab
2. Random drill still starts from graph-expandable positions
3. Before/After suggestions still filtered by graph connectivity
4. Path string displays correctly for sequences
5. Save/load cycle preserves sequences correctly
6. Existing sequences with `grapplemapExtractSpec` still load (backward compatibility)
