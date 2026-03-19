# Technique Library

**Audience:** AI agents and developers taking over the Sunnah Skills project.  
**Purpose:** Document the current technique library implementation and a technique-specific roadmap for expansion and user interactivity.

---

## Current State

### Overview

The technique library is a BJJ/grappling visualization feature powered by **GrappleMap** data. It renders 3D stick-figure sequences (two mannequins: attacker + defender) using Three.js and `@react-three/fiber`. The library appears in two places:

1. **`/techniques`** — Dedicated Technique Library page with one featured sequence
2. **Homepage** — "Academy Telemetry" section, middle card with a live `TechniqueViewer`

### Route & Navigation

| Route | Component | Nav link |
|---|---|---|
| `/techniques` | `TechniqueLibrary.tsx` | **None** — reachable only via direct URL |

The navbar does not link to `/techniques`. Users must type the URL or follow an in-page link.

### Components

| Component | File | Role |
|---|---|---|
| `TechniqueViewer` | `components/grapplemap/TechniqueViewer.tsx` | Thin wrapper: `Suspense` + `MannequinViewer` |
| `MannequinScene` / `MannequinViewer` | `components/grapplemap/MannequinScene.tsx` | Main 3D viewer: `Canvas` + `MannequinSceneInner`. Renders two `HumanPlayer` mannequins (attacker/defender) with joint spheres and limb cylinders, auto-rotating orbit controls, grid, and lighting. Fetches `/data/sequence.json` and animates over frames. |
| `GrappleMapScene` | `components/grapplemap/grapplemapScene.tsx` | Alternative scene: line-segment skeletons instead of mannequins. Also fetches `/data/sequence.json`. **Not used** anywhere in the app. |

**Active stack:** `TechniqueViewer` → `MannequinViewer` → `MannequinSceneInner` (Three.js + `@react-three/fiber`).

### Data Source

| File | Path | Usage |
|---|---|---|
| `sequence.json` | `client/public/data/sequence.json` | Loaded by `MannequinScene` and `GrappleMapScene` via `fetch("/data/sequence.json")` |
| `scenes.json` | `client/public/data/scenes.json` | Present in `public/data/` but **not referenced** in client code |

**`sequence.json` format:**
- `meta`: `name`, `extractedAt`, `totalFrames`, `positions`, `transitions`
- `markers`: Array of `{ name, frame, type }` — `type` is `"position"` or `"transition"`
- `frames`: `number[][][][]` — `frames[frameIdx][playerIdx][jointIdx][x,y,z]`. 23 joints per player, 37 frames in the current file.

**Current sequence:** "Uchi-mata → Armbar → Tap" — collar tie → throw finish → armbar → staredown. Positions and transitions are named in `markers`.

### GrappleMap Integration

The **GrappleMap** project lives at `GrappleMap/` (project root, gitignored). It is an external project:

- **Source:** `GrappleMap.txt` (~2.6 MB) — plain-text database of positions and transitions
- **Tools:** `GrappleMap/preview/` — Vite preview app; `GrappleMap/drills/` — `.script` files; `GrappleMap/doc/` — docs
- **Data flow:** GrappleMap → `GrappleMap.txt` → scripts → JSON. Sunnah Skills uses `client/public/data/sequence.json` (and `scenes.json` is present but unused). One sequence is currently used.

The original `sunnahskills.html` prototype used an iframe to `./GrappleMap/preview/dist/index.html`. The React app uses the embedded `TechniqueViewer` instead.

### Homepage Integration

- **Location:** `Home.tsx` lines 125–143
- **Context:** "Academy Telemetry" section, middle card of a 3-column grid
- **Implementation:** Live `TechniqueViewer` in a `DarkCard` (h-64), labeled "Technique Viewer" with overlay text "Base: Locked" / "Posture: 98%"

---

## Architecture

### Component Hierarchy

```
TechniqueLibrary (page)
  └── DarkCard
        └── TechniqueViewer (Suspense)
              └── MannequinViewer
                    └── MannequinSceneInner
                          ├── Canvas (Three.js)
                          ├── OrbitControls
                          ├── HumanPlayer (attacker)
                          ├── HumanPlayer (defender)
                          └── Grid / lighting
```

### Data Flow

```
client/public/data/sequence.json
  └── fetch("/data/sequence.json")
        └── MannequinSceneInner
              └── useMemo: frames → positions → mesh updates
                    └── useFrame: animate frame index over time
```

### Joint Model

`MannequinScene.tsx` defines a 23-joint skeleton (`J` object) and `ANATOMY_SEGMENTS` for limb cylinders. Joints include: toes, heels, ankles, knees, hips, shoulders, elbows, wrists, hands, fingers, core, neck, head.

---

## Future Roadmap (Technique-Library-Specific)

### 1. Navigation & Discoverability

- **Add nav link to `/techniques`** — Include "Techniques" or "Technique Library" in the main navbar (e.g. alongside Schedule, About, Contact) so users can discover the library without knowing the URL.

### 2. Multi-Scene Grid

- **Grid of technique cards** — Replace the single "Featured Sequence" card with a browsable grid of multiple sequences. Each card shows:
  - Thumbnail or mini preview of the 3D scene
  - Technique name (e.g. "Uchi-mata → Armbar → Tap")
  - Short description
  - Click to expand or navigate to a detail view

- **Scene selection** — Allow users to pick a technique from the grid. The selected `TechniqueViewer` loads the corresponding `sequence.json` (or a scene-specific data file).

### 3. Data Pipeline

- **Multiple sequences** — Currently `sequence.json` is a single hardcoded file. Extend to support:
  - Multiple JSON files in `public/data/` (e.g. `uchimata-armbar.json`, `guard-pass.json`)
  - Or a manifest index (e.g. `scenes.json`) that lists available sequences with metadata (name, description, file path, tags)

- **GrappleMap → Sunnah Skills pipeline** — Document or automate the process of:
  - Extracting sequences from `GrappleMap.txt` or GrappleMap scripts
  - Converting to the `sequence.json` format expected by `MannequinScene`
  - Placing output in `client/public/data/`

- **Use `scenes.json`** — The file exists but is unused. Wire it as the source of truth for the technique catalog (list of scenes, metadata, file paths).

### 4. User Interactivity

- **Playback controls** — Add play/pause, speed slider, scrubber (frame slider). Currently the animation auto-plays.

- **Jump to markers** — Click on a marker (position/transition name) to jump to that frame. Use the `markers` array from `sequence.json`.

- **Orbit controls** — `OrbitControls` is already present; ensure it is discoverable (e.g. tooltip: "Drag to rotate"). Consider reset button.

- **Fullscreen / expand** — Allow users to expand the viewer to fullscreen or a larger modal for better viewing.

- **Mobile touch** — Verify OrbitControls and any future controls work well on touch devices (pinch zoom, rotate).

### 5. Curation & Content

- **Curated default for homepage** — The roadmap mentions a curated default scene (e.g. Guard Position). Choose a technique that best represents the academy and set it as the homepage preview.

- **Tags and categories** — If multiple sequences exist, support filtering by tag (e.g. stand-up, submissions, transitions) or category (e.g. fundamentals, advanced).

### 6. Technical Debt

- **`GrappleMapScene`** — Either use it (e.g. as a lighter alternative view) or remove it to avoid dead code.
- **`scenes.json`** — Wire it or remove it; avoid leaving unused data files.

---

## File Reference

| Path | Purpose |
|---|---|
| `client/src/pages/TechniqueLibrary.tsx` | Technique Library page |
| `client/src/pages/Home.tsx` | Homepage with TechniqueViewer in telemetry section |
| `client/src/components/grapplemap/TechniqueViewer.tsx` | Viewer wrapper |
| `client/src/components/grapplemap/MannequinScene.tsx` | Main 3D scene |
| `client/src/components/grapplemap/grapplemapScene.tsx` | Unused skeleton scene |
| `client/public/data/sequence.json` | Current sequence data |
| `client/public/data/scenes.json` | Unused (catalog metadata) |
| `GrappleMap/` | External GrappleMap project (gitignored) |
| `GrappleMap/README.md` | GrappleMap overview |
| `GrappleMap/doc/` | GrappleMap docs (web-editor, etc.) |

---

## Dependencies

- `three` — 3D core
- `@react-three/fiber` — React renderer for Three.js
- `three/examples/jsm/controls/OrbitControls` — Camera controls

---

## Acceptance Criteria (for Handoff)

An agent extending the technique library should be able to:

1. **Understand** — Know where the viewer lives, how data flows, and what `sequence.json` format is expected.
2. **Add sequences** — Add new JSON files and wire them into the catalog (once `scenes.json` or manifest is used).
3. **Extend the UI** — Add a grid, nav link, filters, or playback controls without breaking the existing viewer.
4. **Integrate GrappleMap** — Use GrappleMap docs and scripts to extract new sequences into the Sunnah Skills format.
