import { getGuardianFromRequest } from "../../_utils/guardianAuth";
import { DEFAULT_CURRENCY } from "../../../shared/money";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const guardian = await getGuardianFromRequest(env, request);
  if (!guardian) return json({ error: "Please sign in first." }, { status: 401 });

  const rows = await env.DB.prepare(
    `SELECT
       o.id,
       o.later_amount_cents,
       o.later_payment_date,
       o.metadata_json,
       group_concat(DISTINCT p.name) as program_names
     FROM enrollment_orders o
     LEFT JOIN registrations r ON r.enrollment_order_id = o.id
     LEFT JOIN programs p ON p.id = r.program_id
     WHERE o.guardian_account_id = ?
       AND o.status = 'partially_paid'
       AND COALESCE(o.later_amount_cents, 0) > 0
       AND o.later_payment_date IS NOT NULL
       AND o.second_stripe_payment_intent_id IS NULL
     GROUP BY o.id
     ORDER BY date(o.later_payment_date) ASC, o.id ASC`,
  )
    .bind(guardian.guardianAccountId)
    .all<{
      id: number;
      later_amount_cents: number | null;
      later_payment_date: string | null;
      metadata_json: string | null;
      program_names: string | null;
    }>();

  return json({
    fees: (rows.results ?? []).map((row) => ({
      orderId: Number(row.id),
      amountCents: Math.max(0, Number(row.later_amount_cents ?? 0)),
      currency: DEFAULT_CURRENCY,
      chargeDate: row.later_payment_date,
      programNames: String(row.program_names ?? "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
    })),
  });
}
