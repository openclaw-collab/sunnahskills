import React, { useMemo } from "react";
import { TelemetryCard } from "@/components/brand/TelemetryCard";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { formatMoneyFromCents } from "@shared/money";

type RegistrationRow = {
  registration_id: number;
  registration_status: string;
  program_name: string;
  payment_status: string | null;
  payment_amount: number | null;
};

type PaymentRow = {
  payment_id: number;
  status: string;
  amount: number;
  currency: string;
};

function sumCents(rows: Array<{ amount: number | null | undefined }>) {
  return rows.reduce((acc, r) => acc + (typeof r.amount === "number" ? r.amount : 0), 0);
}

function money(amountCents: number, currency = "CAD") {
  return formatMoneyFromCents(amountCents, { currency });
}

export function AdminOverview({
  registrations,
  payments,
}: {
  registrations: RegistrationRow[];
  payments: PaymentRow[];
}) {
  const stats = useMemo(() => {
    const totalRegs = registrations.length;
    const paidRegs = registrations.filter((r) => r.payment_status === "paid").length;
    const activeRegs = registrations.filter((r) => r.registration_status === "active").length;
    const pendingPay = registrations.filter((r) => r.registration_status === "pending_payment").length;
    const revenue = sumCents(payments.filter((p) => p.status === "paid"));
    return { totalRegs, paidRegs, activeRegs, pendingPay, revenue };
  }, [registrations, payments]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <TelemetryCard title="Registrations" label="total">
          {stats.totalRegs}
        </TelemetryCard>
        <TelemetryCard title="Paid" label="count">
          {stats.paidRegs}
        </TelemetryCard>
        <TelemetryCard title="Active" label="count">
          {stats.activeRegs}
        </TelemetryCard>
        <TelemetryCard title="Pending" label="payment">
          {stats.pendingPay}
        </TelemetryCard>
        <TelemetryCard title="Revenue" label="paid">
          {money(stats.revenue)}
        </TelemetryCard>
      </div>

      <PremiumCard className="bg-white border border-charcoal/10">
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">
          Snapshot
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-charcoal/10 bg-cream/60 px-4 py-3">
            <div className="text-charcoal/60">Most recent registration</div>
            <div className="mt-1 text-charcoal">
              {registrations[0]
                ? `${registrations[0].program_name} • #${registrations[0].registration_id}`
                : "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-charcoal/10 bg-cream/60 px-4 py-3">
            <div className="text-charcoal/60">Most recent payment</div>
            <div className="mt-1 text-charcoal">
              {payments[0] ? `${payments[0].status} • ${money(payments[0].amount)}` : "—"}
            </div>
          </div>
          <div className="rounded-2xl border border-charcoal/10 bg-cream/60 px-4 py-3">
            <div className="text-charcoal/60">Quick reminder</div>
            <div className="mt-1 text-charcoal">Statuses update from Stripe webhooks.</div>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
