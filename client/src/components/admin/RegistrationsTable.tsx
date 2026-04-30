import React, { useEffect, useMemo, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { cn } from "@/lib/utils";
import { summarizePaymentLifecycle } from "@/components/admin/paymentLifecycle";
import { formatAdminDateTime } from "@/components/admin/adminDateTime";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { DEFAULT_ADMIN_FILTERS, buildAdminQuery, type AdminFilterState } from "@/components/admin/adminFilterOptions";

type RegistrationRow = {
  registration_id: number;
  registration_status: string;
  created_at: string;
  program_name: string;
  program_slug: string;
  track?: string | null;
  session_id?: number | null;
  session_name?: string | null;
  session_day_of_week?: string | null;
  session_start_time?: string | null;
  session_end_time?: string | null;
  bundled_session_schedule?: string | null;
  location_id?: string | null;
  location_name?: string | null;
  guardian_name: string;
  guardian_email: string;
  guardian_phone?: string | null;
  student_name: string;
  student_dob?: string | null;
  student_gender?: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  stripe_payment_intent_id?: string | null;
  receipt_url?: string | null;
  order_id?: number | null;
  order_status?: string | null;
  order_manual_review_reason?: string | null;
  order_total_cents?: number | null;
  order_amount_due_today_cents?: number | null;
  order_later_amount_cents?: number | null;
  order_later_payment_date?: string | null;
  order_paid_cents?: number | null;
};

type Program = { id: string; name: string; slug: string };
type Location = { id: string; display_name: string };

function humanize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ");
}

function badgeClass(kind: "status" | "payment", value: string) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-mono-label border whitespace-nowrap";
  if (kind === "payment") {
    if (value === "paid") return `${base} bg-moss text-cream border-moss`;
    if (value === "failed") return `${base} bg-clay text-cream border-clay`;
    if (value === "pending") return `${base} bg-gold/18 border-gold/45 text-charcoal`;
    return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/70`;
  }
  if (value === "active") return `${base} bg-moss/10 border-moss/20 text-moss`;
  if (value === "pending_payment") return `${base} bg-gold/18 border-gold/45 text-charcoal`;
  if (value === "waitlisted") return `${base} bg-clay/10 border-clay/20 text-clay`;
  if (value === "cancelled") return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/55`;
  return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/70`;
}

function paymentBadgeClass(variant: "paid_full" | "paid_partial" | "pending" | "failed" | "superseded" | "cancelled") {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-mono-label border whitespace-nowrap";
  if (variant === "paid_full") return `${base} bg-moss text-cream border-moss`;
  if (variant === "paid_partial") return `${base} bg-moss/12 text-moss border-gold/55 border-[1.5px]`;
  if (variant === "failed") return `${base} bg-clay text-cream border-clay`;
  if (variant === "pending") return `${base} bg-gold/18 border-gold/45 text-charcoal`;
  if (variant === "superseded" || variant === "cancelled") return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/55`;
  return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/70`;
}

function rowToneClasses(variant: "paid_full" | "paid_partial" | "pending" | "failed" | "superseded" | "cancelled") {
  if (variant === "paid_full") return "border-l-[3px] border-l-moss/70";
  if (variant === "paid_partial") return "border-l-[3px] border-l-gold/65";
  if (variant === "failed") return "border-l-[3px] border-l-clay/70";
  if (variant === "superseded" || variant === "cancelled") return "border-l-[3px] border-l-charcoal/18 opacity-80";
  return "border-l-[3px] border-l-gold/55";
}

export function RegistrationsTable({
  initial,
  onOpen,
  showSuperseded,
  onShowSupersededChange,
}: {
  initial: RegistrationRow[];
  onOpen: (id: number) => void;
  showSuperseded: boolean;
  onShowSupersededChange: (value: boolean) => void;
}) {
  const [rows, setRows] = useState<RegistrationRow[]>(initial);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [filters, setFilters] = useState<AdminFilterState>({
    ...DEFAULT_ADMIN_FILTERS,
    includeSuperseded: showSuperseded,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [programsRes, catalogRes] = await Promise.all([fetch("/api/admin/programs"), fetch("/api/programs")]);
      const programsJson = (await programsRes.json().catch(() => null)) as any;
      const catalogJson = (await catalogRes.json().catch(() => null)) as any;
      setPrograms((programsJson?.programs ?? []) as Program[]);
      setLocations((catalogJson?.locations ?? []) as Location[]);
    })();
  }, []);

  useEffect(() => {
    setFilters((current) => ({ ...current, includeSuperseded: showSuperseded }));
  }, [showSuperseded]);

  useEffect(() => {
    // Extract unique tracks from current rows
    const uniqueTracks = Array.from(new Set(rows.map((r) => r.track).filter((t): t is string => Boolean(t))));
    setTracks(uniqueTracks);
  }, [rows]);

  const queryUrl = useMemo(() => {
    return buildAdminQuery("/api/admin/registrations", filters);
  }, [filters]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(queryUrl);
      const json = (await res.json().catch(() => null)) as any;
      setRows((json?.registrations ?? []) as RegistrationRow[]);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const summary = {
      total: rows.length,
      paidFull: 0,
      halfPaid: 0,
      unpaid: 0,
      failed: 0,
      superseded: 0,
    };

    rows.forEach((row) => {
      const lifecycle = summarizePaymentLifecycle({
        orderStatus: row.order_status,
        latestPaymentStatus: row.payment_status,
        manualReviewReason: row.order_manual_review_reason,
        totalCents: row.order_total_cents,
        amountDueTodayCents: row.order_amount_due_today_cents ?? row.payment_amount,
        laterAmountCents: row.order_later_amount_cents,
        laterPaymentDate: row.order_later_payment_date,
        latestPaymentAmountCents: row.order_paid_cents ?? row.payment_amount,
      });

      if (lifecycle.statusVariant === "paid_full") summary.paidFull += 1;
      if (lifecycle.statusVariant === "paid_partial") summary.halfPaid += 1;
      if (lifecycle.statusVariant === "pending") summary.unpaid += 1;
      if (lifecycle.statusVariant === "failed") summary.failed += 1;
      if (lifecycle.statusVariant === "superseded") summary.superseded += 1;
    });

    return summary;
  }, [rows]);

  // Group rows by order_id for sibling visualization
  const groupedRows = useMemo(() => {
    const orderGroups = new Map<number | null, RegistrationRow[]>();
    rows.forEach((row) => {
      const key = row.order_id ?? null;
      if (!orderGroups.has(key)) {
        orderGroups.set(key, []);
      }
      orderGroups.get(key)!.push(row);
    });
    // Flatten with sibling markers
    const result: Array<RegistrationRow & { isFirstSibling: boolean; siblingCount: number }> = [];
    orderGroups.forEach((groupRows) => {
      groupRows.forEach((row, index) => {
        result.push({
          ...row,
          isFirstSibling: index === 0,
          siblingCount: groupRows.length,
        });
      });
    });
    return result;
  }, [rows]);

  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
            Registrations
          </div>
          <div className="font-body text-sm text-charcoal/70 mt-1">
            Filter by program, location, track, registration status, and payment state. Click a student to view full details.
          </div>
        </div>
      </div>

      <AdminFilterBar
        value={filters}
        programs={programs}
        locations={locations}
        tracks={tracks.map((value) => ({ value, label: value.replace(/-/g, " ") }))}
        mode="registrations"
        refreshing={loading}
        onChange={(next) => {
          setFilters(next);
          onShowSupersededChange(next.includeSuperseded);
        }}
        onRefresh={refresh}
      />

      <div className="mb-5 mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="rounded-[1.75rem] border border-charcoal/10 bg-cream/45 px-4 py-3">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
            Reading this table
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={paymentBadgeClass("paid_full")}>Paid in full</span>
            <span className={paymentBadgeClass("paid_partial")}>Half paid</span>
            <span className={paymentBadgeClass("pending")}>Unpaid</span>
            <span className={paymentBadgeClass("failed")}>Failed</span>
            {showSuperseded ? <span className={paymentBadgeClass("superseded")}>Superseded</span> : null}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/68">
            Paid in full is fully collected, half paid means the first charge went through, and unpaid means checkout started but card confirmation did not finish.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.5rem] border border-charcoal/10 bg-cream/45 px-4 py-3">
            <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/40">Total</div>
            <div className="mt-1 font-display text-2xl text-charcoal">{counts.total}</div>
          </div>
          <div className="rounded-[1.5rem] border border-moss/20 bg-moss/6 px-4 py-3">
            <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-moss">Paid in full</div>
            <div className="mt-1 font-display text-2xl text-charcoal">{counts.paidFull}</div>
          </div>
          <div className="rounded-[1.5rem] border border-gold/30 bg-white px-4 py-3">
            <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-moss">Half paid</div>
            <div className="mt-1 font-display text-2xl text-charcoal">{counts.halfPaid}</div>
          </div>
          <div className="rounded-[1.5rem] border border-gold/25 bg-gold/10 px-4 py-3">
            <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/55">Unpaid</div>
            <div className="mt-1 font-display text-2xl text-charcoal">{counts.unpaid}</div>
          </div>
          <div className="rounded-[1.5rem] border border-clay/20 bg-clay/8 px-4 py-3">
            <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-clay">Failed</div>
            <div className="mt-1 font-display text-2xl text-charcoal">{counts.failed}</div>
          </div>
          {showSuperseded ? (
            <div className="rounded-[1.5rem] border border-charcoal/10 bg-charcoal/[0.03] px-4 py-3">
              <div className="font-mono-label text-[9px] uppercase tracking-[0.18em] text-charcoal/40">Superseded</div>
              <div className="mt-1 font-display text-2xl text-charcoal">{counts.superseded}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.8rem] border border-charcoal/8 bg-white shadow-[0_20px_50px_rgba(26,26,26,0.04)]">
        <table className="w-full text-sm">
          <thead className="text-charcoal/60 bg-cream/55">
            <tr className="border-b border-charcoal/10">
              <th className="text-left py-3 pl-4 pr-4">Student</th>
              <th className="text-left py-3 pr-4">Program / Track</th>
              <th className="text-left py-3 pr-4">Location / Session</th>
              <th className="text-left py-3 pr-4">Status</th>
              <th className="text-left py-3 pr-4">Payment</th>
              <th className="text-left py-3 pr-4">Guardian</th>
              <th className="text-left py-3 pr-4">Registered</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((r) => {
              const paymentLifecycle = summarizePaymentLifecycle({
                orderStatus: r.order_status,
                latestPaymentStatus: r.payment_status,
                manualReviewReason: r.order_manual_review_reason,
                totalCents: r.order_total_cents,
                amountDueTodayCents: r.order_amount_due_today_cents ?? r.payment_amount,
                laterAmountCents: r.order_later_amount_cents,
                laterPaymentDate: r.order_later_payment_date,
                latestPaymentAmountCents: r.order_paid_cents ?? r.payment_amount,
              });

              return (
                <tr
                  key={r.registration_id}
                  className={cn(
                    "border-b border-charcoal/5 hover:bg-cream/35 cursor-pointer transition-colors",
                    rowToneClasses(paymentLifecycle.statusVariant),
                    r.siblingCount > 1 && r.isFirstSibling ? "border-t-2 border-t-charcoal/10" : "",
                    r.siblingCount > 1 && !r.isFirstSibling ? "bg-cream/20" : "",
                  )}
                  onClick={() => onOpen(r.registration_id)}
                >
                  <td className="py-3 pl-4 pr-4">
                    <div className="font-medium text-charcoal">{r.student_name}</div>
                    <div className="mt-1 text-xs text-charcoal/45">
                      Reg #{r.registration_id}
                      {r.siblingCount > 1 && (
                        <span className="ml-2 text-moss">• Sibling {r.isFirstSibling ? "1" : "2+"} of {r.siblingCount}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-charcoal">{r.program_name}</div>
                    <div className="mt-1 text-xs text-charcoal/55">
                      {r.track ? r.track.replace(/-/g, " ") : humanize(r.program_slug)}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-charcoal">{r.location_name ?? (r.location_id === "oakville" ? "Oakville" : "Mississauga")}</div>
                    <div className="mt-1 text-xs text-charcoal/55">
                      {r.bundled_session_schedule ||
                        [r.session_day_of_week, r.session_start_time && r.session_end_time ? `${r.session_start_time}-${r.session_end_time}` : null]
                          .filter(Boolean)
                          .join(" · ") ||
                        r.session_name ||
                        "No session"}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={badgeClass("status", r.registration_status)}>
                      {humanize(r.registration_status)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 min-w-[14rem]">
                    <div className={cn(paymentBadgeClass(paymentLifecycle.statusVariant), "w-fit")}>
                      {paymentLifecycle.compactLabel}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-charcoal/58">
                      {paymentLifecycle.compactDetail}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-charcoal">{r.guardian_name}</div>
                    <div className="mt-1 text-xs text-charcoal/52">{r.guardian_email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-charcoal/75">{formatAdminDateTime(r.created_at)}</div>
                    <div className="mt-1 text-xs text-charcoal/40">Toronto time</div>
                  </td>
                </tr>
              );
            })}
            {groupedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-charcoal/60">
                  No registrations match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}
