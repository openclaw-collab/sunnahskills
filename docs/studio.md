# Stakeholder Studio

## What it is

Stakeholder Studio is a built-in review tool for non-technical users (clients, stakeholders) to:

- Edit any text on the site
- Swap images on designated image slots
- Experiment with color theme presets + custom 3-slot palettes
- Leave pinned comments on any component
- Drag components to visually reposition them
- Export a JSON of all changes for developer review
- Share a link with other reviewers for real-time sync

All of this happens as an overlay on the live site — no separate tool, no screenshots.

## How to open Studio

| URL | Mode |
|---|---|
| `https://site.com/?studio=1` | **Local mode** — changes stored in `localStorage` only, not shared |
| `https://site.com/?studio=<UUID>` | **Session mode** — changes synced to D1, visible to all users with the same link |

To create a new shared session, open Studio in local mode and click **"Create shareable session"** in the panel.

## Access control

If a session is password-protected, the `PasswordGate` component is shown before the Studio panel opens. The entered password is bcrypt-compared against `studio_sessions.password_hash` server-side. On success, an HttpOnly cookie `studio_auth_<sessionId>=1` is set for the session.

## Studio UI components (`client/src/studio/`)

| File | Purpose |
|---|---|
| `StudioProvider.tsx` | Context + state management, polling, PATCH debounce |
| `StudioPanel.tsx` | The floating side panel UI (toggle, tabs, export) |
| `StudioShell.tsx` | Top bar + navigate mode badge |
| `ComponentHighlighter.tsx` | Hover/click overlay on annotated components |
| `InspectorPanel.tsx` | Edit panel for selected component (text fields, image slots) |
| `ThemeEditor.tsx` | Theme preset selector + custom palette sliders |
| `ChangesExport.tsx` | Export JSON button + preview |
| `PasswordGate.tsx` | Password modal for protected sessions |
| `StudioText.tsx` | Wrapper for editable text nodes |
| `StudioBlock.tsx` | Wrapper for annotated component blocks |
| `studioTypes.ts` | All TypeScript types |
| `studioStore.ts` | Local state helpers |
| `autoTextStudio.ts` | Auto-assigns stable IDs to unattributed text nodes |
| `useStudio.ts` | Hook to consume `StudioContext` |

## Annotating pages for Studio

### Editable text

Wrap any text with `<StudioText>`:

```tsx
import { StudioText } from "@/studio/StudioText";

<StudioText k="home.hero.titleA" defaultText="Built Through" />
```

The `k` value becomes the stable edit target. In practice, pages use structured keys such as `home.hero.titleA` or `programs.eyebrow`.

### Editable blocks (commenting + drag)

Wrap a section with `<StudioBlock>`:

```tsx
import { StudioBlock } from "@/studio/StudioBlock";

<StudioBlock id="hero-section" label="Hero Section">
  {/* any content */}
</StudioBlock>
```

Studio will show a hover outline and allow comments/drag on this block.

### Image slots

Add `data-studio-image-slot="key"` to any `<img>`:

```tsx
<img
  src={programImage}
  data-studio-image-slot="hero-bg"
  alt="Program hero"
/>
```

Studio's image uploader will replace the `src` on matching slots.

## Auto text studio

`autoTextStudio.ts` scans the DOM for text nodes not already wrapped in `StudioText` and assigns auto-generated IDs (`auto-<hash>`). This allows all site text to be editable without requiring explicit annotation.

## Theme system

Three built-in presets + one custom:

| Preset | Background | Subtheme1 | Highlight |
|---|---|---|---|
| `brand` | `#F5F0E8` cream | `#1A1A1A` charcoal | `#CE5833` clay |
| `sage` | `#EEF1EC` | `#2C3E2D` | `#6B8F71` |
| `ink` | `#0F0F0F` | `#1F1F1F` | `#CE5833` |
| `clay` | `#FDF0E8` | `#3D1A0A` | `#CE5833` |

Custom mode: choose background, subtheme1, and highlight with color pickers. Changes are applied as CSS variable overrides on `:root` in real time.

## Multi-user sync

In session mode (`?studio=UUID`):

1. **Polling:** `StudioProvider` polls `GET /api/studio/sessions/:id` every 10 seconds and merges remote state into local optimistic state.
2. **Sending:** Every change is debounced 800ms then sent as `PATCH /api/studio/sessions/:id` with the updated JSON columns.

Conflict model: **last-write-wins** per field. This is intentional — Studio is a review tool, not a collaborative editor.

## Drag-to-reposition

Each `StudioBlock` can be dragged in Studio mode. Positions are stored as `{ dx, dy }` CSS transform offsets, keyed by `componentId`, in `studio_sessions.positions_json`. Drag is reset per-component with a "Reset position" button in the inspector.

## Navigate mode

The Studio overlay intercepts clicks for editing/commenting. Toggle "Navigate" in the Studio panel header to temporarily disable the overlay and browse the site normally. A small badge in the corner re-activates Studio mode.

## Export JSON

The **Export Changes** tab produces a `studio-changes-<timestamp>.json` file:

```json
{
  "exportedAt": "2026-03-18T12:00:00Z",
  "sessionId": "abc-123",
  "theme": { "background": "#F5F0E8", "subtheme1": "#1A1A1A", "highlight": "#CE5833" },
  "changes": [
    {
      "route": "/",
      "componentId": "hero",
      "fieldKey": "headline",
      "type": "text",
      "oldValue": "Character Before Competition",
      "newValue": "Strength, Character, Community",
      "author": "sarah@example.com",
      "timestamp": "2026-03-18T11:55:00Z"
    }
  ],
  "comments": [
    {
      "route": "/about",
      "componentId": "coach-section",
      "message": "Can we add a photo of Coach Abdullah?",
      "author": "sarah@example.com",
      "timestamp": "2026-03-18T11:56:00Z"
    }
  ]
}
```

The developer reviews this JSON and applies desired changes to the source code.

## Backend API (`functions/api/studio/`)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/studio/sessions` | `POST` | Create new shared session (`{ id, shareUrl, name, protected }`) |
| `/api/studio/sessions/:id` | `GET` | Load session (verifies password cookie if protected) |
| `/api/studio/sessions/:id` | `POST` | Authenticate password-protected session |
| `/api/studio/sessions/:id` | `PATCH` | Update session state (edits, comments, positions, theme) |
| `/api/studio/uploads` | `POST` | Upload image (R2 if enabled, else base64 data URL in D1) |

## R2 image uploads

R2 is configured but commented out in `wrangler.toml`. To enable:

1. Enable R2 in your Cloudflare Dashboard
2. Create bucket: `npx wrangler r2 bucket create sunnahskills-studio-uploads`
3. Uncomment the `[[r2_buckets]]` block in `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "STUDIO_UPLOADS"
bucket_name = "sunnahskills-studio-uploads"
```

4. Redeploy. Until R2 is enabled, uploads are stored as base64 data URLs inside the `uploads_json` D1 column (functional but not production-ideal for large images).

## D1 schema

```sql
CREATE TABLE IF NOT EXISTS studio_sessions (
  id TEXT PRIMARY KEY,                   -- UUID (also the URL token)
  name TEXT,
  protected INTEGER DEFAULT 0,          -- 1 = requires password
  password_hash TEXT,                    -- bcrypt hash
  theme_preset_id TEXT DEFAULT 'brand',
  custom_theme_json TEXT,                -- { background, subtheme1, highlight }
  edits_json TEXT DEFAULT '[]',          -- StudioEditEntry[]
  comments_json TEXT DEFAULT '[]',       -- StudioCommentEntry[]
  uploads_json TEXT DEFAULT '[]',        -- StudioUploadEntry[]
  positions_json TEXT DEFAULT '{}',      -- { [componentId]: { dx, dy } }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
