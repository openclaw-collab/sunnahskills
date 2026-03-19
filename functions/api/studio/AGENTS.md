<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# studio

## Purpose
Stakeholder Studio session sync API. Enables multi-user collaborative review sessions.

## Key Files

| File | Route | Description |
|------|-------|-------------|
| `sessions.ts` | POST /api/studio/sessions | Create new session |
| `sessions/[id].ts` | GET/PATCH /api/studio/sessions/:id | Get/update session |
| `uploads.ts` | POST /api/studio/uploads | Upload images |

## Session Data Structure

```typescript
interface StudioSession {
  id: string;           // UUID
  password_hash?: string; // bcrypt hash (optional)
  edits_json: string;   // JSON array of edits
  comments_json: string; // JSON array of comments
  positions_json: string; // Scroll positions
  custom_theme_json: string; // Theme overrides
  created_at: string;
  updated_at: string;
}
```

## Flow

1. **Create**: POST `/api/studio/sessions` → Returns { id, url }
2. **Load**: GET `/api/studio/sessions/:id` → Returns session data
3. **Sync**: Client polls GET every 5 seconds
4. **Update**: PATCH `/api/studio/sessions/:id` with changes
5. **Password**: Optional bcrypt protection

## For AI Agents

### Working In This Directory
- UUIDv4 for session IDs
- JSON columns for flexible data
- Debounce updates client-side
- Handle concurrent edits (last-write-wins)

### Security
- Rate limit session creation
- Validate password on protected sessions
- Sanitize uploaded images
- Don't expose internal IDs

<!-- MANUAL: -->
