# Technique Library

**Audience:** AI agents and developers taking over the Sunnah Skills project.
**Purpose:** Document the current technique library implementation.

---

## Current State

### Overview

The technique library is a BJJ/grappling visualization feature powered by **GrappleMap** data. It renders 3D stick-figure sequences (two mannequins: attacker + defender) using Three.js and `@react-three/fiber`. The library appears in two places:

1. **`/techniques`** — Dedicated Technique Library page with a browsable catalog fed by `scenes.json` and `/data/library/sequences/manifest.json`
2. **Homepage** — "Academy Telemetry" section, middle card with a live `TechniqueViewer`

### Route & Navigation

| Route | Component | Nav link |
|---|---|---|
| `/techniques` | `TechniqueLibrary.tsx` | **Yes** — "Techniques" link in main navbar |

The navbar (`Navigation.tsx`) includes `{ label: "Techniques", href: "/techniques" }` in its `navSections` array, making the library reachable from every page.

### Components

| Component | File | Role |
|---|---|---|
| `TechniqueViewer` | `components/grapplemap/TechniqueViewer.tsx` | Thin wrapper: `Suspense` + `MannequinViewer`. Accepts `className`, `sequencePath`, and `onThumbnailReady`. |
| `MannequinScene` / `MannequinViewer` | `components/grapplemap/MannequinScene.tsx` | Main 3D viewer: `Canvas` + `MannequinSceneInner`. Renders two `HumanPlayer` mannequins (attacker/defender) with joint spheres and limb cylinders, auto-rotating orbit controls, grid, and lighting. Fetches the path given by `sequencePath` and animates over frames. Includes `PlaybackOverlay` with play/pause, speed slider, scrubber, and marker jump buttons. |
| `GrappleMapScene` | `components/grapplemap/grapplemapScene.tsx` | Alternative scene: line-segment skeletons. **Not used** anywhere in the app. |

**Active stack:** `TechniqueViewer` → `MannequinViewer` → `MannequinSceneInner` (Three.js + `@react-three/fiber`).

**Prop chain:** `sequencePath` flows from `TechniqueLibrary` (sourced from `scene.meta.dataPath`) → `TechniqueViewer` → `MannequinViewer` → `MannequinSceneInner` + `PlaybackOverlay`.

### Data Source

| File | Path | Usage |
|---|---|---|
| `scenes.json` | `client/public/data/scenes.json` | Static card catalog for the library page. Loaded by `useScenesCatalog` in `TechniqueLibrary.tsx`. |
| `library/admin/positions.json` | `client/public/data/library/admin/positions.json` | Static positions catalog used by the admin sequence builder. |
| `library/sequences/manifest.json` | `client/public/data/library/sequences/manifest.json` | Library sequence index loaded by `loadLibrarySequences()`. |
| `library/sequences/*.json` | `client/public/data/library/sequences/*.json` | Individual technique sequences consumed by the library browser. |
| `sequence.json` | `client/public/data/sequence.json` | Legacy single-sequence fallback used by `grapplemapScene.tsx` and the default `TechniqueViewer` prop. |

### `scenes.json` Catalog Format

```json
{
  "scenes": {
    "<slug>": {
      "meta": {
        "name": "Technique Name",
        "tags": ["tag1", "tag2"],
        "description": ["Line one of description.", "Line two."],
        "dataPath": "/data/<slug>.json"
      }
    }
  }
}
```

- **`scenes`** — object keyed by URL-safe slug (e.g. `"uchi-mata-armbar"`)
- **`meta.name`** — display name shown on the card and detail panel
- **`meta.tags`** — array of tag strings for display
- **`meta.description`** — array of paragraph strings; index `[1]` used as card subtitle
- **`meta.dataPath`** — URL path to the per-technique JSON file (served from `client/public/`)

### Library Sequence JSON Format

```json
{
  "meta": {
    "id": "sequence-id",
    "name": "Technique Name",
    "slug": "technique-name",
    "positionCategory": "closed-guard",
    "startingPosition": "Closed guard",
    "endingPosition": "Armbar",
    "difficulty": "beginner",
    "description": ["Paragraph one", "Paragraph two"],
    "sources": ["GrappleMap"],
    "totalFrames": 37,
    "positions": 2,
    "transitions": 2
  },
  "markers": [
    { "name": "Position Name", "frame": 0, "type": "position" },
    { "name": "Transition Name", "frame": 12, "type": "transition" }
  ],
  "frames": "<number[][][][]>",
  "verified": true
}
```

- **`markers`** — array of `{ name, frame, type }`. `type` is `"position"` or `"transition"`. Used by `PlaybackOverlay` for jump buttons.
- **`frames`** — `frames[frameIdx][playerIdx][jointIdx][x, y, z]`. Two players, 23 joints each. Player 0 = attacker, player 1 = defender.

### Data Pipeline

To add a new technique:

1. Extract the sequence from `GrappleMap.txt` using the extraction script:
   ```bash
   node scripts/extract-techniques.mjs
   ```
2. Place the output JSON in `client/public/data/library/sequences/<slug>.json`.
3. Update `client/public/data/library/sequences/manifest.json` so `loadLibrarySequences()` can discover the new sequence.
4. Add or update a card in `client/public/data/scenes.json` if the technique should appear in the main library page.

---

## Architecture

### Component Hierarchy

```
TechniqueLibrary (page)
  ├── useScenesCatalog() → fetch /data/scenes.json → SceneEntry[]
  ├── useLibrarySequences() → loadLibrarySequences() → TechniqueSequence[]
  ├── TechniqueCard (one per scene)
  │     └── TechniqueViewer sequencePath={scene.meta.dataPath}
  │           └── MannequinViewer
  │                 ├── Canvas (Three.js)
  │                 │     └── MannequinSceneInner
  │                 │           ├── HumanPlayer (attacker)
  │                 │           ├── HumanPlayer (defender)
  │                 │           ├── OrbitControls (auto-rotate)
  │                 │           └── Grid / lighting
  │                 └── PlaybackOverlay
  │                       ├── Play/Pause button
  │                       ├── Scrubber (frame slider)
  │                       ├── Speed slider
  │                       └── Marker jump buttons
  ├── DetailPanel (slide-in from right, on card click)
  │     └── TechniqueViewer sequencePath={scene.meta.dataPath}
  └── FullscreenModal (full viewport, on expand button)
        └── TechniqueViewer sequencePath={scene.meta.dataPath}
```

### Data Flow

```
client/public/data/scenes.json
  └── useScenesCatalog (TechniqueLibrary.tsx)
        └── SceneEntry[] (id, meta: { name, tags, description, dataPath })
              └── TechniqueCard / DetailPanel / FullscreenModal
                    └── TechniqueViewer sequencePath={scene.meta.dataPath}
                          └── MannequinViewer
                                └── fetch(sequencePath) → { frames, markers }
                                      └── MannequinSceneInner: animate frames
                                      └── PlaybackOverlay: controls + marker jumps

client/public/data/library/sequences/manifest.json
  └── loadLibrarySequences()
        └── TechniqueSequence[]
              └── SequencesGrid / fullscreen detail views
```

### Playback Controls

`MannequinScene.tsx` includes a `PlaybackOverlay` component rendered as an absolutely-positioned overlay at the bottom of each viewer. Controls:

| Control | Behaviour |
|---|---|
| Play / Pause | Toggles animation. Button shows `▶` or `⏸`. |
| Scrubber | `<input type="range">` from 0 to `totalFrames`. Dragging seeks the animation. |
| Speed | `<input type="range">` from 0.25× to 2×. Adjusts animation speed multiplier. |
| Marker jump | One button per entry in `markers[]`. Clicking seeks to `marker.frame`. |

### Detail Panel

Slides in from the right when a card is clicked. Triggered by `setSelected(scene)` in `TechniqueLibrary`. Shows:
- A full `TechniqueViewer` with playback controls (272px tall)
- Technique name (large heading)
- Tags (pill badges)
- Full description (all paragraphs from `meta.description`)

Closes on Escape key or backdrop click.

### Fullscreen Modal

Opens when the expand icon (top-right of card) is clicked. Triggered by `setFullscreen(scene)`. Shows:
- A header bar with technique name and close button
- Full-viewport `TechniqueViewer` with playback controls

Closes on Escape key.

### Joint Model

`MannequinScene.tsx` defines a 23-joint skeleton (`J` object) and `ANATOMY_SEGMENTS` for limb cylinders. Joints include: toes, heels, ankles, knees, hips, shoulders, elbows, wrists, hands, fingers, core, neck, head.

---

## File Reference

| Path | Purpose |
|---|---|
| `client/src/pages/TechniqueLibrary.tsx` | Technique Library page — grid, detail panel, fullscreen modal |
| `client/src/pages/Home.tsx` | Homepage with TechniqueViewer in telemetry section |
| `client/src/components/Navigation.tsx` | Navbar with `/techniques` link in `navSections` |
| `client/src/components/grapplemap/TechniqueViewer.tsx` | Viewer wrapper (Suspense + MannequinViewer); accepts `sequencePath` |
| `client/src/components/grapplemap/MannequinScene.tsx` | Main 3D scene + PlaybackOverlay; accepts `sequencePath` |
| `client/src/components/grapplemap/grapplemapScene.tsx` | Unused skeleton scene |
| `client/public/data/scenes.json` | Technique catalog (slug → meta with dataPath) |
| `client/public/data/library/admin/positions.json` | Admin position catalog |
| `client/public/data/library/sequences/manifest.json` | Sequence manifest used by the sequence browser |
| `client/public/data/library/sequences/<slug>.json` | Per-technique sequence data (frames + markers) |
| `scripts/extract-techniques.mjs` | Pipeline script: GrappleMap.txt → per-technique JSON + manifest/catalog |
| `GrappleMap/` | External GrappleMap project (gitignored) |

---

## Dependencies

- `three` — 3D core
- `@react-three/fiber` — React renderer for Three.js
- `three/examples/jsm/controls/OrbitControls` — Camera controls

---

## Acceptance Criteria (for Handoff)

An agent extending the technique library should be able to:

1. **Understand** — Know where the viewer lives, how data flows, and what JSON formats are expected.
2. **Add sequences** — Run `node scripts/extract-techniques.mjs`, place output JSON in `client/public/data/library/sequences/`, and update the manifest/catalog as needed.
3. **Extend the UI** — Add filters, tags, or additional playback features without breaking existing viewers.
4. **Integrate GrappleMap** — Use GrappleMap docs and scripts to extract new sequences into the Sunnah Skills format.
