import { DEFAULT_CURRENCY } from "../../../shared/money";
import { sendMailChannelsEmail } from "../../_utils/email";
import { laterChargeReminderEmail } from "../../_utils/emailTemplates";

interface Env {
  DB: D1Database;
  CRON_SECRET?: string;
  EMAIL_FROM?: string;
  SITE_URL?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("Authorization");
  if (!secret || auth !== `Bearer ${secret}`) return json({ error: "Unauthorized" }, { status: 401 });

  const dueTomorrow = await env.DB.prepare(
    `SELECT
       o.id,
       o.later_amount_cents,
       o.later_payment_date,
       g.email as guardian_email,
       g.full_name as guardian_name
     FROM enrollment_orders o
     JOIN guardians g ON g.id = o.guardian_id
     WHERE o.status = 'partially_paid'
       AND COALESCE(o.later_amount_cents, 0) > 0
       AND o.later_payment_date IS NOT NULL
       AND date(o.later_payment_date) = date('now', '+1 day')
       AND o.second_stripe_payment_intent_id IS NULL
       AND o.later_charge_reminder_sent_at IS NULL
     ORDER BY o.id ASC
     LIMIT 100`,
  ).all<{
    id: number;
    later_amount_cents: number;
    later_payment_date: string;
    guardian_email: string;
    guardian_name: string | null;
  }>();

  const results: { orderId: number; sent: boolean }[] = [];
  for (const order of dueTomorrow.results ?? []) {
    const message = laterChargeReminderEmail({
      guardianName: order.guardian_name?.trim() || "there",
      amountCents: Math.max(0, Number(order.later_amount_cents ?? 0)),
      currency: DEFAULT_CURRENCY,
      chargeDate: order.later_payment_date,
      orderId: Number(order.id),
      siteUrl: env.SITE_URL,
    });

    const sent = await sendMailChannelsEmail(env, {
      to: { email: order.guardian_email, name: order.guardian_name ?? undefined },
      from: { email: env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev", name: "Sunnah Skills" },
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    if (sent) {
      await env.DB.prepare(
        `UPDATE enrollment_orders
         SET later_charge_reminder_sent_at = datetime('now')
         WHERE id = ?`,
      )
        .bind(order.id)
        .run();
    }
    results.push({ orderId: Number(order.id), sent });
  }

  return json({ ok: true, processed: results.length, results });
}
