interface Env {
  DB: D1Database;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  SITE_URL?: string;
}

type WaitlistRequest = {
  email: string;
  name: string;
  programId: string;
  sessionId?: number | null;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const body = (await request.json().catch(() => null)) as WaitlistRequest | null;
  if (!body?.email || !body?.name || !body?.programId) return json({ error: "Invalid payload" }, { status: 400 });

  await env.DB.prepare(
    `
    INSERT INTO waitlist (guardian_id, email, name, program_id, session_id, notified, created_at)
    VALUES (NULL, ?, ?, ?, ?, 0, datetime('now'))
    `,
  )
    .bind(body.email, body.name, body.programId, body.sessionId ?? null)
    .run();

  // Best-effort emails
  try {
    const { sendMailChannelsEmail } = await import("../_utils/email");
    const { waitlistConfirmationEmail, adminNewRegistrationEmail } = await import("../_utils/emailTemplates");
    const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";

    const program = await env.DB.prepare(`SELECT name FROM programs WHERE id = ?`).bind(body.programId).first();
    const programName = String(program?.name ?? body.programId);

    const userMsg = waitlistConfirmationEmail({ name: body.name, programName, siteUrl: env.SITE_URL });
    await sendMailChannelsEmail(env, {
      to: { email: body.email, name: body.name },
      from: { email: fromEmail, name: "Sunnah Skills" },
      subject: userMsg.subject,
      text: userMsg.text,
      html: userMsg.html,
    });

    if (env.EMAIL_TO) {
      const adminMsg = adminNewRegistrationEmail({
        guardianName: body.name,
        guardianEmail: body.email,
        studentName: "(waitlist)",
        programName,
        registrationId: 0,
        siteUrl: env.SITE_URL,
      });
      await sendMailChannelsEmail(env, {
        to: { email: env.EMAIL_TO, name: "Sunnah Skills Admin" },
        from: { email: fromEmail, name: "Sunnah Skills" },
        subject: adminMsg.subject,
        text: adminMsg.text,
        html: adminMsg.html,
      });
    }
  } catch {
    // swallow
  }

  return json({ ok: true });
}

