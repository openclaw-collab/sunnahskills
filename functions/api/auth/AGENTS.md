<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# auth

## Purpose
Admin authentication endpoints. Handles login, logout, and session validation.

## Key Files

| File | Route | Description |
|------|-------|-------------|
| `login.ts` | POST /api/auth/login | Authenticate admin, set session cookie |
| `logout.ts` | POST /api/auth/logout | Clear session cookie |
| `me.ts` | GET /api/auth/me | Get current admin info |

## Authentication Flow

1. **Login**: POST credentials → bcrypt compare → create session → set cookie
2. **Session**: Cookie `admin_session` contains a UUID token
3. **Validation**: Token checked against `admin_sessions` table with TTL
4. **Logout**: Delete session row, clear cookie

## Session Schema

```sql
CREATE TABLE admin_sessions (
  id INTEGER PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## For AI Agents

### Working In This Directory
- bcrypt.compare for password verification
- UUID token for session
- 7-day session expiry
- HttpOnly, Secure, SameSite=Lax cookies

### Security
- Never return password hash in responses
- Rate limit login attempts
- Log failed attempts
- Use prepared statements for all queries

<!-- MANUAL: -->
