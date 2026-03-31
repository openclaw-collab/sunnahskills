# Composer-Parity Sequence Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Sunnah Skills sequence builder behave like the original GrappleMap composer for coaches: choose a clean starting position, extend only through connected graph routes, preview the full sequence live as it is built, edit existing sequences safely, and publish the exact same canonical graph path to the technique library.

**Architecture:** Keep the current `AdminSequences.tsx` shell and `TechniqueViewer` renderer, but change the builder model so it stores and edits a true directional graph path instead of a lossy flat list. Use generated admin graph data for route discovery, a shared directional path contract for save/load/extract, and structured extraction diagnostics so the builder can surface invalid or stale path steps instead of silently skipping them.

**Tech Stack:** React 18 + TypeScript, Vitest + Testing Library, Cloudflare Pages Functions + D1, shared GrappleMap extraction pipeline, vendored `GrappleMap/` composer graph model.

---

## Why the original composer feels richer

The original composer is richer for behavioral reasons, not because its UI is prettier:

- It operates on `steps = [{transition, reverse}]`, not a lossy position/transition list.
- Its choices are generated directly from the graph node you are currently on:
  - incoming routes from `db.nodes[start_node].incoming`
  - outgoing routes from `db.nodes[end_node].outgoing`
  - see `GrappleMap/src/composer.js:140-199`
- It never asks the user to manually stitch destination positions; clicking a route mutates the route chain and recomputes frames.
- Playback is built from connected transition steps via `follow(steps, mirror)` with reorientation composition and overlap-frame removal; see `GrappleMap/src/composer.js:471-525`.
- Direction is first-class through `step_from(step)` / `step_to(step)` and encoded in URLs as `-485` for reverse; see `GrappleMap/src/gm.js:414-426` and `GrappleMap/src/composer.js:234-243`.

The Sunnah builder currently feels smaller because it still treats the graph as a catalog too often. Composer treats it as a path machine.

---

## File map

| File | Responsibility |
| --- | --- |
| `client/src/pages/admin/AdminSequences.tsx` | Main composer-like builder behavior, connected route discovery, live preview, edit existing sequences |
| `shared/grapplemapFlatSequence.ts` | Canonical directional path type + serialization/parsing shared by client/functions/scripts |
| `GrappleMap/scripts/sequence-extractor.js` | Canonical parsing support for directional transition specs |
| `functions/api/admin/sequences.ts` | Persist and reload canonical directional graph paths, re-extract on save |
| `functions/api/admin/grapplemap-extract.ts` | Return canonical extraction plus structured diagnostics for invalid path steps |
| `GrappleMap/scripts/grapplemap-graph-core.js` | Canonical graph extraction and diagnostic collection |
| `client/src/components/grapplemap/MannequinScene.tsx` | Sequence asset loading cache / retry hardening |
| `client/src/__tests__/integration/admin-sequences.test.tsx` | Builder behavior tests |
| `shared/__tests__/grapplemapFlatSequence.test.ts` | Shared path serialization/parsing tests |
| `functions/__tests__/grapplemap-sequences.test.ts` | Backend save/extract contract tests |

---

## Task 1: Lock the canonical graph path contract

**Files:**
- Modify: `shared/grapplemapFlatSequence.ts`
- Modify: `GrappleMap/scripts/sequence-extractor.js`
- Modify: `GrappleMap/scripts/sequence-extractor.d.ts`
- Modify: `GrappleMap/scripts/grapplemap-sequence-core.d.ts`
- Test: `shared/__tests__/grapplemapFlatSequence.test.ts`

- [ ] **Step 1: Write the failing shared tests for reverse-direction path round-trip**

Add tests proving the canonical path contract can round-trip a reverse transition:

```ts
it("round-trips reverse transitions in the canonical path format", () => {
  const spec = [
    { type: "position", id: 21 },
    { type: "transition", id: 485, reverse: true },
    { type: "position", id: 46 },
  ] as const;

  const serialized = serializeGraphPathSpec([...spec]);

  expect(serialized).toBe("p21, t485r, p46");
  expect(parseFlatSpec(serialized)).toEqual(spec);
  expect(parseFlatSpec("p21, -485, p46")).toEqual(spec);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --run shared/__tests__/grapplemapFlatSequence.test.ts
```

Expected: FAIL because reverse direction is not fully preserved by the shared parser/serializer.

- [ ] **Step 3: Make direction part of the canonical shared path type**

Implement:

```ts
export type FlatSpecItem = { type: "position" | "transition"; id: number; reverse?: boolean };

export function serializeGraphPathSpec(spec: GrappleMapGraphPathStep[]) {
  return spec
    .map((step) =>
      step.type === "position" ? `p${step.id}` : `t${step.id}${step.reverse ? "r" : ""}`,
    )
    .join(", ");
}
```

And extend `parseSpec()` to support both `t485r` and legacy `-485`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --run shared/__tests__/grapplemapFlatSequence.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/grapplemapFlatSequence.ts GrappleMap/scripts/sequence-extractor.js GrappleMap/scripts/sequence-extractor.d.ts GrappleMap/scripts/grapplemap-sequence-core.d.ts shared/__tests__/grapplemapFlatSequence.test.ts
git commit -m "fix(grapplemap): preserve reverse direction in canonical path specs"
```

---

## Task 2: Make admin save/load round-trip true composer paths

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx`
- Modify: `functions/api/admin/sequences.ts`
- Test: `client/src/__tests__/integration/admin-sequences.test.tsx`
- Test: `functions/__tests__/grapplemap-sequences.test.ts`

- [ ] **Step 1: Write failing tests for reverse path reload and backend persistence**

Add an integration test that loads a saved sequence containing a reverse step and asserts the builder shows:

```ts
expect(screen.getAllByText(/p21 -> t485r -> p46/i).length).toBeGreaterThan(0);
```

Add a backend test that saves `grapplemapPathSpec` with a reverse transition and asserts:

```ts
expect(graphSource?.grapplemapPathSpec).toEqual(reverseSpec);
expect(graphSource?.grapplemapPathString).toBe("p21, t485r, p46");
```

- [ ] **Step 2: Run targeted tests to verify failure**

Run:

```bash
npm test -- --run client/src/__tests__/integration/admin-sequences.test.tsx functions/__tests__/grapplemap-sequences.test.ts
```

Expected: FAIL because saved direction is lost or not reconstructed correctly.

- [ ] **Step 3: Change admin derivation and hydration to use directional paths**

In `AdminSequences.tsx`:

```ts
function deriveExtractSpec(markers: SequenceMarker[]): FlatSpecItem[] {
  return markers
    .filter((marker) => marker.libraryType !== "note" && marker.flatId != null)
    .map((marker) => ({
      type: marker.type as "position" | "transition",
      id: marker.flatId as number,
      ...(marker.type === "transition" ? { reverse: Boolean(marker.reverse) } : {}),
    }));
}
```

And when rebuilding markers from saved specs:

```ts
const transition = transitionsByFlatId.get(step.id);
return transition ? markerFromTransition(applyDirectionalTransition(transition, Boolean(step.reverse)), index) : null;
```

In `functions/api/admin/sequences.ts`, normalize `reverse?: boolean` during parse/save instead of filtering it away.

- [ ] **Step 4: Run targeted tests to verify pass**

Run:

```bash
npm test -- --run client/src/__tests__/integration/admin-sequences.test.tsx functions/__tests__/grapplemap-sequences.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx functions/api/admin/sequences.ts client/src/__tests__/integration/admin-sequences.test.tsx functions/__tests__/grapplemap-sequences.test.ts
git commit -m "fix(admin): round-trip directional GrappleMap paths"
```

---

## Task 3: Make search behave like composer, not a disconnected catalog

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx`
- Test: `client/src/__tests__/integration/admin-sequences.test.tsx`

- [ ] **Step 1: Write failing test for disconnected search additions**

Add a test that builds a sequence, switches to Search → Transitions, searches a disconnected move, and asserts the action is disabled with a clear label:

```ts
expect(screen.getByRole("button", { name: /disconnected/i })).toBeDisabled();
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --run client/src/__tests__/integration/admin-sequences.test.tsx
```

Expected: FAIL because search still behaves as a broad add-anything catalog.

- [ ] **Step 3: Implement composer-style transition insertion modes**

In `AdminSequences.tsx`, add a helper:

```ts
const getTransitionInsertionMode = useCallback((item: LibraryItemSummary) => {
  if (item.libraryType !== "transition") return "none";
  if (sequenceMarkers.length === 0) return "start";
  if (currentPositionNodeId != null && item.fromNodeId === currentPositionNodeId) return "after";
  if (firstPositionNodeId != null && item.toNodeId === firstPositionNodeId) return "before";
  return "disconnected";
}, [currentPositionNodeId, firstPositionNodeId, sequenceMarkers.length]);
```

Then in Search:
- keep the full catalog visible for discovery
- only allow `Add after` or `Add before` when connected
- disable disconnected transitions instead of hiding them
- show connection status in the row subtitle

This preserves coach discoverability without allowing broken chains.

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npm test -- --run client/src/__tests__/integration/admin-sequences.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx client/src/__tests__/integration/admin-sequences.test.tsx
git commit -m "fix(admin): constrain search additions to connected graph routes"
```

---

## Task 4: Keep preview live and stable while building

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx`
- Modify: `client/src/components/grapplemap/MannequinScene.tsx`
- Test: `client/src/__tests__/integration/admin-sequences.test.tsx`

- [ ] **Step 1: Write failing tests or a focused repro for preview staleness/null caching**

At minimum, add an integration assertion that the builder preview updates after adding steps and does not get stuck on a stale selected-item preview. If unit testing the cache is easier, create a focused test around `loadGrappleMapSequence()` that retries after a failure instead of permanently caching `null`.

- [ ] **Step 2: Run the targeted repro/test to verify failure**

Run either the new Vitest test or a manual reproduction script. Record the failure mode before patching.

- [ ] **Step 3: Fix preview request races and null caching**

In `AdminSequences.tsx`, only apply selected-item preview results from the latest request:

```ts
const requestId = selectedPreviewRequestId.current + 1;
selectedPreviewRequestId.current = requestId;
...
if (selectedPreviewRequestId.current !== requestId) return;
```

In `MannequinScene.tsx`, stop caching `null` forever:

```ts
const json = await pending;
if (json) SEQUENCE_CACHE.set(sequencePath, json);
return json;
```

Also surface a retryable error state instead of swallowing every fetch error.

- [ ] **Step 4: Run targeted tests to verify pass**

Run the new targeted tests plus the admin integration suite.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx client/src/components/grapplemap/MannequinScene.tsx client/src/__tests__/integration/admin-sequences.test.tsx
git commit -m "fix(preview): stabilize live sequence preview while building"
```

---

## Task 5: Add structured extraction diagnostics instead of silent skips

**Files:**
- Modify: `GrappleMap/scripts/grapplemap-graph-core.js`
- Modify: `functions/api/admin/grapplemap-extract.ts`
- Modify: `client/src/pages/admin/AdminSequences.tsx`
- Test: `functions/__tests__/grapplemap-sequences.test.ts`

- [ ] **Step 1: Write a failing backend test for invalid graph steps**

Add a test that posts an invalid spec and expects structured diagnostics instead of a silent partial success.

Example expected shape:

```ts
expect(data.error).toBeUndefined();
expect(data.diagnostics).toEqual([
  expect.objectContaining({ type: "missing-position", id: 999999 }),
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --run functions/__tests__/grapplemap-sequences.test.ts
```

Expected: FAIL because invalid steps currently only log to stderr and continue.

- [ ] **Step 3: Return diagnostics from the graph extractor and surface them in admin**

In `grapplemap-graph-core.js`, collect warnings/errors instead of only `console.error()`:

```js
const diagnostics = [];
...
diagnostics.push({ type: 'missing-position', id: step.id, message: `Position ${step.id} not found.` });
```

Return:

```js
return { frames, markers, diagnostics };
```

Thread those diagnostics through `/api/admin/grapplemap-extract`, and in `AdminSequences.tsx` show a coach-readable message when extraction returns diagnostics.

- [ ] **Step 4: Run targeted tests to verify pass**

Run:

```bash
npm test -- --run functions/__tests__/grapplemap-sequences.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add GrappleMap/scripts/grapplemap-graph-core.js functions/api/admin/grapplemap-extract.ts client/src/pages/admin/AdminSequences.tsx functions/__tests__/grapplemap-sequences.test.ts
git commit -m "feat(extract): report GrappleMap path diagnostics to admin"
```

---

## Task 6: Make existing sequences editable in place

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx`
- Test: `client/src/__tests__/integration/admin-sequences.test.tsx`

- [ ] **Step 1: Write failing tests for in-place transition editing**

Add tests for:
- toggling a bidirectional transition between forward and reverse
- replacing a transition with another connected route
- rejecting edits that break chain continuity

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- --run client/src/__tests__/integration/admin-sequences.test.tsx
```

Expected: FAIL because the builder currently supports delete but not true transition editing.

- [ ] **Step 3: Implement `updateMarker()` + connected replacement flow**

Add a minimal path-edit API inside `AdminSequences.tsx`:

```ts
function updateMarker(index: number, nextMarker: SequenceMarker) {
  setSequenceMarkers((current) => {
    const next = [...current];
    next[index] = nextMarker;
    return reindexMarkers(next);
  });
}
```

Then add:
- direction toggle for `bidirectional` transitions
- replace action that uses the same `before` / `after` connectivity rules as composer
- continuity validation before applying the edit

- [ ] **Step 4: Run tests to verify pass**

Run the targeted integration suite and ensure editing a published sequence still works end-to-end.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx client/src/__tests__/integration/admin-sequences.test.tsx
git commit -m "feat(admin): edit connected transition steps in place"
```

---

## Task 7: Tighten builder feedback and always-on live analysis

**Files:**
- Modify: `client/src/pages/admin/AdminSequences.tsx`
- Test: `client/src/__tests__/integration/admin-sequences.test.tsx`

- [ ] **Step 1: Write failing test for always-visible path + live preview cues**

Assert that while building (not only in Review), the builder shows:
- the current graph path string
- the live preview panel
- clear connection status text for selected transitions

- [ ] **Step 2: Run test to verify failure where applicable**

Run:

```bash
npm test -- --run client/src/__tests__/integration/admin-sequences.test.tsx
```

- [ ] **Step 3: Implement persistent coach feedback**

Keep the current UI shell, but make these behaviors always visible:
- current canonical path string in the builder header
- current end position summary
- route status in Search rows (`continues current end`, `connects into current start`, `disconnected`)
- preview panel always on-screen while composing

This is the coach-facing parity win: they can think in moves and see the sequence as they build it.

- [ ] **Step 4: Run tests to verify pass**

Run the admin integration tests again.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminSequences.tsx client/src/__tests__/integration/admin-sequences.test.tsx
git commit -m "feat(admin): keep graph path and live preview visible while composing"
```

---

## Task 8: Full verification and deployment handoff

**Files:**
- Modify as needed from prior tasks
- Verify production data path if shipping

- [ ] **Step 1: Run targeted builder and extraction suites**

Run:

```bash
npm test -- --run shared/__tests__/grapplemapFlatSequence.test.ts client/src/__tests__/integration/admin-sequences.test.tsx functions/__tests__/grapplemap-sequences.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full safety checks**

Run:

```bash
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual local verification**

Verify locally in both:
- `http://127.0.0.1:5173/admin/sequences`
- `http://localhost:8788/admin/sequences`

Check these flows:
- start from a position
- add connected route after
- prepend connected route before
- search and see disconnected transitions disabled
- load an existing sequence and edit it
- reverse a bidirectional route if available
- preview remains live through each change
- save + reload preserves exact path string including reverse suffixes

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat(admin): deliver composer-parity sequence builder behavior"
git push origin main
```

- [ ] **Step 5: Deploy and verify production**

Deploy with the existing Pages workflow, then verify:
- builder route loads
- published technique still previews correctly
- edited sequence round-trips through the library

---

## Spec coverage self-check

Covered:
- full graph-connected route discovery like composer
- clean starting-position workflow
- live preview while building
- canonical extraction shared with technique library
- edit existing techniques in builder
- preserve reverse transitions
- publish to technique library
- foundation for future temporary scene / technique builder work (same graph-path + preview core)

Not included in this plan:
- a brand-new separate “temporary scenes” builder UI
- replacing the current builder shell with the exact composer UI

That omission is intentional. The right move is to make the current builder behavior match composer first, then reuse the same path/preview core for temporary scenes later.
