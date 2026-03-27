import React from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { formatMoneyFromCents } from "@shared/money";

type PaymentRow = {
  order_id?: number;
  payment_id?: number;
  registration_id?: number;
  order_status?: string;
  status?: string;
  manual_review_status?: string;
  manual_review_reason?: string | null;
  last_payment_error?: string | null;
  total_cents?: number;
  amount_due_today_cents?: number;
  later_amount_cents?: number;
  later_payment_date?: string | null;
  guardian_name?: string | null;
  registration_count?: number;
  student_names?: string | null;
  latest_payment_status?: string | null;
  first_registration_id?: number | null;
  amount?: number;
  currency?: string;
  created_at: string;
};

function money(amountCents: number, currency = "CAD") {
  return formatMoneyFromCents(amountCents, { currency });
}

export function PaymentsSummary({ payments }: { payments: PaymentRow[] }) {
  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-4">
        Orders & Payments
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-charcoal/60">
            <tr className="border-b border-charcoal/10">
              <th className="text-left py-2 pr-4">Order</th>
              <th className="text-left py-2 pr-4">Guardian</th>
              <th className="text-left py-2 pr-4">Students</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2 pr-4">Review</th>
              <th className="text-left py-2 pr-4">Today / Later</th>
              <th className="text-left py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.order_id ?? p.payment_id ?? p.registration_id ?? p.created_at} className="border-b border-charcoal/5">
                <td className="py-2 pr-4 align-top">
                  <div className="text-charcoal">#{p.order_id ?? p.payment_id ?? "—"}</div>
                  <div className="text-xs text-charcoal/55">
                    {typeof p.registration_count === "number"
                      ? `Regs: ${p.registration_count}`
                      : p.registration_id
                        ? `Reg: ${p.registration_id}`
                        : "—"}
                  </div>
                </td>
                <td className="py-2 pr-4 align-top">{p.guardian_name ?? "—"}</td>
                <td className="py-2 pr-4 align-top">{p.student_names ?? "—"}</td>
                <td className="py-2 pr-4 align-top">
                  <div>{p.order_status ?? p.status ?? "—"}</div>
                  <div className="text-xs text-charcoal/55">{p.latest_payment_status ?? "—"}</div>
                </td>
                <td className="py-2 pr-4 align-top">
                  <div>{p.manual_review_status ?? "—"}</div>
                  <div className="text-xs text-charcoal/55">
                    {p.manual_review_reason ?? p.last_payment_error ?? "—"}
                  </div>
                </td>
                <td className="py-2 pr-4 align-top">
                  <div>{money(p.amount_due_today_cents ?? p.amount ?? 0, (p.currency ?? "cad").toUpperCase())}</div>
                  <div className="text-xs text-charcoal/55">
                    {(p.later_amount_cents ?? 0) > 0
                      ? `${money(p.later_amount_cents ?? 0, (p.currency ?? "cad").toUpperCase())} on ${p.later_payment_date ?? "TBD"}`
                      : "No later balance"}
                  </div>
                </td>
                <td className="py-2">{p.created_at}</td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-charcoal/60">
                  No orders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}
