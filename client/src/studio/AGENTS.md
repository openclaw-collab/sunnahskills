<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# studio

## Purpose
Stakeholder Studio review tool - allows stakeholders to review the site, add comments, capture screenshots, and sync state across users via D1.

## Key Files

| File | Description |
|------|-------------|
| `StudioProvider.tsx` | React context for studio state management |
| `StudioPanel.tsx` | Studio overlay UI (comment form, toolbar) |
| `StudioTypes.ts` | TypeScript types for studio sessions |

## How It Works

1. **Session Mode**: URL param `?studio=<UUID>` activates session mode
2. **Local Mode**: URL param `?studio=1` activates localStorage-only mode
3. **Password Gate**: Protected sessions require bcrypt password
4. **Sync**: Polls `/api/studio/sessions/:id` every 5s for multi-user sync
5. **Persistence**: Debounced PATCH to D1 for state persistence

## For AI Agents

### Working In This Directory
- Studio is wrapped around entire app in `App.tsx`
- Provider manages global studio state
- Panel renders overlay UI conditionally
- All edits/comments sync via API to D1

### API Endpoints
- `GET /api/studio/sessions/:id` - Load session
- `POST /api/studio/sessions/:id` - Create session
- `PATCH /api/studio/sessions/:id` - Update session
- `POST /api/studio/uploads` - Upload images

<!-- MANUAL: -->
