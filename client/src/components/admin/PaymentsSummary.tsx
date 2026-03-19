import React from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";

type PaymentRow = {
  payment_id: number;
  registration_id: number;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
};

function money(amountCents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function PaymentsSummary({ payments }: { payments: PaymentRow[] }) {
  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-4">
        Payments
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-charcoal/60">
            <tr className="border-b border-charcoal/10">
              <th className="text-left py-2 pr-4">Payment</th>
              <th className="text-left py-2 pr-4">Registration</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2 pr-4">Amount</th>
              <th className="text-left py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.payment_id} className="border-b border-charcoal/5">
                <td className="py-2 pr-4">#{p.payment_id}</td>
                <td className="py-2 pr-4">#{p.registration_id}</td>
                <td className="py-2 pr-4">{p.status}</td>
                <td className="py-2 pr-4">{money(p.amount, (p.currency ?? "usd").toUpperCase?.() ?? "USD")}</td>
                <td className="py-2">{p.created_at}</td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-charcoal/60">
                  No payments found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}

