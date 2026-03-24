import bcrypt from "bcryptjs";
import { createAdminSession, ensureAdminSecuritySchema, logAdminActivity, normalizePermissions } from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
  SITE_URL?: string;
}

// Rate limiting constants
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 300; // 5 minutes
const RATE_LIMIT_BLOCK_DURATION = 600; // 10 minutes

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
  // Cloudflare-specific headers
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback headers
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  
  const realIP = request.headers.get('X-Real-IP');
  if (realIP) return realIP;
  
  return 'unknown';
}

/**
 * Check rate limit for an IP
 * Returns: { allowed: boolean, remaining: number, resetAt?: number }
 */
async function checkRateLimit(
  env: Env, 
  ip: string, 
  email: string
): Promise<{ allowed: boolean; remaining: number; resetAt?: number; blocked?: boolean }> {
  const key = `rate_limit:login:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  
  // Try to get existing rate limit data from D1
  const existing = await env.DB.prepare(
    `SELECT attempts, first_attempt_at, blocked_until 
     FROM rate_limits 
     WHERE key = ? AND expires_at > datetime('now')`
  ).bind(key).first<{ attempts: number; first_attempt_at: string; blocked_until: string | null }>();
  
  if (existing) {
    const attempts = existing.attempts;
    const blockedUntil = existing.blocked_until ? Math.floor(new Date(existing.blocked_until).getTime() / 1000) : 0;
    
    // Check if currently blocked
    if (blockedUntil > now) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt: blockedUntil,
        blocked: true 
      };
    }
    
    // Check if window has expired, reset if so
    const firstAttempt = Math.floor(new Date(existing.first_attempt_at).getTime() / 1000);
    if (now - firstAttempt > RATE_LIMIT_WINDOW_SECONDS) {
      // Reset window
      await env.DB.prepare(
        `UPDATE rate_limits 
         SET attempts = 1, first_attempt_at = datetime('now'), blocked_until = NULL, expires_at = datetime('now', '+1 hour')
         WHERE key = ?`
      ).bind(key).run();
      
      return { 
        allowed: true, 
        remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 
      };
    }
    
    // Check if max attempts reached
    if (attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      // Block the IP
      const blockedUntilTime = now + RATE_LIMIT_BLOCK_DURATION;
      await env.DB.prepare(
        `UPDATE rate_limits 
         SET blocked_until = datetime('now', '+10 minutes'), expires_at = datetime('now', '+1 hour')
         WHERE key = ?`
      ).bind(key).run();
      
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt: blockedUntilTime,
        blocked: true 
      };
    }
    
    // Increment attempt
    await env.DB.prepare(
      `UPDATE rate_limits 
       SET attempts = attempts + 1, expires_at = datetime('now', '+1 hour')
       WHERE key = ?`
    ).bind(key).run();
    
    return { 
      allowed: true, 
      remaining: RATE_LIMIT_MAX_ATTEMPTS - attempts - 1 
    };
  }
  
  // No existing record, create one
  await env.DB.prepare(
    `INSERT INTO rate_limits (key, attempts, first_attempt_at, expires_at) 
     VALUES (?, 1, datetime('now'), datetime('now', '+1 hour'))`
  ).bind(key).run();
  
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_ATTEMPTS - 1 
  };
}

/**
 * Log failed login attempt
 */
async function logFailedAttempt(env: Env, email: string, ip: string, reason: string) {
  await env.DB.prepare(
    `INSERT INTO login_attempts (email, ip_address, success, reason, attempted_at)
     VALUES (?, ?, 0, ?, datetime('now'))`
  ).bind(email, ip, reason).run();
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  
  await ensureAdminSecuritySchema(env);
  
  // Get client IP
  const clientIP = getClientIP(request);
  
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  
  // Validate input
  if (!email || password.length < 8) {
    await logFailedAttempt(env, email || 'unknown', clientIP, 'Invalid input');
    return json({ error: "Invalid credentials" }, { status: 400 });
  }
  
  // Check rate limit
  const rateLimit = await checkRateLimit(env, clientIP, email);
  if (!rateLimit.allowed) {
    const retryAfter = rateLimit.resetAt ? rateLimit.resetAt - Math.floor(Date.now() / 1000) : RATE_LIMIT_BLOCK_DURATION;
    
    await logFailedAttempt(env, email, clientIP, `Rate limited (blocked: ${rateLimit.blocked})`);
    
    return json(
      { 
        error: "Too many login attempts. Please try again later.", 
        retryAfter,
        code: "RATE_LIMITED"
      }, 
      { 
        status: 429,
        headers: { 
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetAt)
        }
      }
    );
  }
  
  // Look up user
  const user = await env.DB.prepare(
    `SELECT id, email, password_hash, name, role, status, permissions_json FROM admin_users WHERE email = ?`,
  )
    .bind(email)
    .first();
    
  if (!user?.id) {
    await logFailedAttempt(env, email, clientIP, 'User not found');
    return json({ error: "Invalid credentials" }, { status: 401 });
  }
  
  if (user.status && String(user.status) !== "active") {
    await logFailedAttempt(env, email, clientIP, 'Account disabled');
    return json({ error: "This account is disabled" }, { status: 403 });
  }
  
  // Verify password
  const ok = await bcrypt.compare(password, String(user.password_hash));
  if (!ok) {
    await logFailedAttempt(env, email, clientIP, 'Invalid password');
    return json({ error: "Invalid credentials" }, { status: 401 });
  }
  
  // Success - clear rate limit for this IP
  await env.DB.prepare(
    `DELETE FROM rate_limits WHERE key = ?`
  ).bind(`rate_limit:login:${clientIP}`).run();
  
  // Update last login
  await env.DB.prepare(`UPDATE admin_users SET last_login = datetime('now') WHERE id = ?`).bind(user.id).run();
  
  // Create session
  const session = await createAdminSession(env, Number(user.id));
  const role = (user.role ?? "admin") as "tech" | "admin";
  const permissions = normalizePermissions(
    user.permissions_json ? JSON.parse(String(user.permissions_json)) : null,
    role,
  );
  
  // Log success
  await logAdminActivity(env, {
    actorAdminUserId: Number(user.id),
    subjectAdminUserId: Number(user.id),
    action: "auth.login",
    entityType: "session",
    entityId: session.token,
    details: { email: user.email, role, ip: clientIP },
  });
  
  return json(
    { 
      ok: true, 
      user: { email: user.email, name: user.name ?? null, role, permissions },
      rateLimit: {
        remaining: rateLimit.remaining
      }
    },
    { 
      status: 200, 
      headers: { 
        "Set-Cookie": session.cookie,
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      } 
    },
  );
}
