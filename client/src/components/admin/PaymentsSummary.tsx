import React from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoneyFromCents } from "@shared/money";
import { cn } from "@/lib/utils";
import { summarizePaymentLifecycle } from "@/components/admin/paymentLifecycle";
import { formatAdminDateTime } from "@/components/admin/adminDateTime";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { DEFAULT_ADMIN_FILTERS, buildAdminQuery, type AdminFilterState } from "@/components/admin/adminFilterOptions";

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
  program_names?: string | null;
  location_names?: string | null;
  tracks?: string | null;
  latest_payment_status?: string | null;
  first_registration_id?: number | null;
  paid_cents?: number | null;
  amount?: number;
  currency?: string;
  created_at: string;
};

function money(amountCents: number, currency = "CAD") {
  return formatMoneyFromCents(amountCents, { currency });
}

function statusVariantClasses(variant: "paid_full" | "paid_partial" | "pending" | "failed" | "superseded" | "cancelled") {
  if (variant === "paid_full") return "bg-moss text-cream border-moss";
  if (variant === "paid_partial") return "bg-moss/12 text-moss border-gold/55 border-[1.5px]";
  if (variant === "failed") return "bg-clay text-cream border-clay";
  if (variant === "pending") return "bg-gold/18 text-charcoal border-gold/40";
  return "bg-charcoal/5 text-charcoal/65 border-charcoal/10";
}

type Program = { id: string; name: string; slug: string };
type Location = { id: string; display_name: string };

export function PaymentsSummary({
  payments,
  showSuperseded,
  onShowSupersededChange,
}: {
  payments: PaymentRow[];
  showSuperseded: boolean;
  onShowSupersededChange: (value: boolean) => void;
}) {
  const [rows, setRows] = React.useState<PaymentRow[]>(payments);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filters, setFilters] = React.useState<AdminFilterState>({
    ...DEFAULT_ADMIN_FILTERS,
    includeSuperseded: showSuperseded,
  });
  const queryUrl = React.useMemo(() => buildAdminQuery("/api/admin/orders", filters), [filters]);

  React.useEffect(() => setRows(payments), [payments]);

  React.useEffect(() => {
    setFilters((current) => ({ ...current, includeSuperseded: showSuperseded }));
  }, [showSuperseded]);

  React.useEffect(() => {
    (async () => {
      const [programsRes, catalogRes] = await Promise.all([fetch("/api/admin/programs"), fetch("/api/programs")]);
      const programsJson = (await programsRes.json().catch(() => null)) as { programs?: Program[] } | null;
      const catalogJson = (await catalogRes.json().catch(() => null)) as { locations?: Location[] } | null;
      setPrograms(programsJson?.programs ?? []);
      setLocations(catalogJson?.locations ?? []);
    })();
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch(queryUrl);
      const json = (await res.json().catch(() => null)) as { orders?: PaymentRow[] } | null;
      setRows(json?.orders ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
          Orders & Payments
        </div>
        <label className="flex items-center gap-2 rounded-full border border-charcoal/10 bg-cream/40 px-3 py-2 text-[11px] uppercase tracking-[0.14em] font-mono-label text-charcoal/65">
          <Checkbox
            checked={showSuperseded}
            onCheckedChange={(checked) => onShowSupersededChange(checked === true)}
            aria-label="Show superseded payments"
          />
          Show superseded
        </label>
      </div>
      <AdminFilterBar
        value={filters}
        programs={programs}
        locations={locations}
        tracks={[]}
        mode="payments"
        refreshing={refreshing}
        onChange={(next) => {
          setFilters(next);
          onShowSupersededChange(next.includeSuperseded);
        }}
        onRefresh={refresh}
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-charcoal/60">
            <tr className="border-b border-charcoal/10">
              <th className="text-left py-2 pr-4">Order</th>
              <th className="text-left py-2 pr-4">Guardian</th>
              <th className="text-left py-2 pr-4">Students</th>
              <th className="text-left py-2 pr-4">Program / Location</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2 pr-4">Review</th>
              <th className="text-left py-2 pr-4">Today / Later</th>
              <th className="text-left py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const lifecycle = summarizePaymentLifecycle({
                orderStatus: p.order_status,
                latestPaymentStatus: p.latest_payment_status ?? p.status,
                manualReviewStatus: p.manual_review_status,
                manualReviewReason: p.manual_review_reason,
                lastPaymentError: p.last_payment_error,
                totalCents: p.total_cents,
                amountDueTodayCents: p.amount_due_today_cents ?? p.amount,
                laterAmountCents: p.later_amount_cents,
                laterPaymentDate: p.later_payment_date,
                paidCents: p.paid_cents,
                latestPaymentAmountCents: p.amount,
                currency: p.currency ?? "cad",
              });
              const currency = (p.currency ?? "cad").toUpperCase();
              const paidText = money(p.paid_cents ?? 0, currency);
              const totalText = money(p.total_cents ?? 0, currency);
              const dueTodayText = money(p.amount_due_today_cents ?? p.amount ?? 0, currency);
              const laterText = (p.later_amount_cents ?? 0) > 0
                ? `${money(p.later_amount_cents ?? 0, currency)} on ${p.later_payment_date ?? "TBD"}`
                : "No later balance";

              return (
                <tr
                  key={p.order_id ?? p.payment_id ?? p.registration_id ?? p.created_at}
                  className="border-b border-charcoal/5"
                >
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
                    <div>{p.program_names ?? "—"}</div>
                    <div className="text-xs text-charcoal/55">{p.location_names ?? "—"}</div>
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-mono-label",
                        statusVariantClasses(lifecycle.statusVariant),
                      )}
                    >
                      {lifecycle.compactLabel}
                    </div>
                    <div className="mt-2 text-xs text-charcoal/70">{lifecycle.detail}</div>
                    <div className="mt-1 text-[11px] text-charcoal/45">
                      Order: {p.order_status ?? p.status ?? "—"} · Payment: {p.latest_payment_status ?? "—"}
                    </div>
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div>{lifecycle.reviewHeadline}</div>
                    <div className="text-xs text-charcoal/55">{lifecycle.reviewDetail}</div>
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div>Today: {dueTodayText}</div>
                    <div className="text-xs text-charcoal/55">Later: {laterText}</div>
                    <div className="text-xs text-charcoal/55">Total: {totalText} · Paid: {paidText}</div>
                  </td>
                  <td className="py-2">
                    <div>{formatAdminDateTime(p.created_at)}</div>
                    <div className="text-xs text-charcoal/45">Toronto time</div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-charcoal/60">
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
