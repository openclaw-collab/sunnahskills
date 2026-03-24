import React, { useEffect, useMemo, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RegistrationRow = {
  registration_id: number;
  registration_status: string;
  created_at: string;
  program_name: string;
  program_slug: string;
  guardian_name: string;
  guardian_email: string;
  student_name: string;
  payment_status: string | null;
  payment_amount: number | null;
};

type Program = { id: string; name: string; slug: string };

function badgeClass(kind: "status" | "payment", value: string) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] font-mono-label border";
  if (kind === "payment") {
    if (value === "paid") return `${base} bg-moss/10 border-moss/20 text-moss`;
    if (value === "failed") return `${base} bg-clay/10 border-clay/20 text-clay`;
    if (value === "pending") return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/70`;
    return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/70`;
  }
  if (value === "active") return `${base} bg-moss/10 border-moss/20 text-moss`;
  if (value === "pending_payment") return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/70`;
  if (value === "waitlisted") return `${base} bg-clay/10 border-clay/20 text-clay`;
  return `${base} bg-charcoal/5 border-charcoal/10 text-charcoal/70`;
}

export function RegistrationsTable({
  initial,
  onOpen,
}: {
  initial: RegistrationRow[];
  onOpen: (id: number) => void;
}) {
  const [rows, setRows] = useState<RegistrationRow[]>(initial);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/programs");
      const json = (await res.json().catch(() => null)) as any;
      setPrograms((json?.programs ?? []) as Program[]);
    })();
  }, []);

  const queryUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (programId !== "all") sp.set("programId", programId);
    if (status !== "all") sp.set("status", status);
    if (q.trim()) sp.set("q", q.trim());
    const qs = sp.toString();
    return `/api/admin/registrations${qs ? `?${qs}` : ""}`;
  }, [programId, q, status]);

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

  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
            Registrations
          </div>
          <div className="font-body text-sm text-charcoal/70 mt-1">
            Filter, search, and open a registration to view details and update status/notes.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OutlineButton
            className="px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]"
            onClick={() => {
              setProgramId("all");
              setStatus("all");
              setQ("");
              setRows(initial);
            }}
          >
            Reset
          </OutlineButton>
          <ClayButton
            className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </ClayButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="space-y-2">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
            Program
          </div>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger className="bg-cream/50 border-charcoal/10">
              <SelectValue placeholder="All programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
            Status
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-cream/50 border-charcoal/10">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="submitted">submitted</SelectItem>
              <SelectItem value="pending_payment">pending_payment</SelectItem>
              <SelectItem value="paid">paid</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="waitlisted">waitlisted</SelectItem>
              <SelectItem value="cancelled">cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
            Search
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Parent, student, or email…"
            className="bg-cream/50 border-charcoal/10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-charcoal/60">
            <tr className="border-b border-charcoal/10">
              <th className="text-left py-2 pr-4">Student</th>
              <th className="text-left py-2 pr-4">Program</th>
              <th className="text-left py-2 pr-4">Reg status</th>
              <th className="text-left py-2 pr-4">Payment</th>
              <th className="text-left py-2 pr-4">Guardian</th>
              <th className="text-left py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.registration_id}
                className="border-b border-charcoal/5 hover:bg-cream/40 cursor-pointer"
                onClick={() => onOpen(r.registration_id)}
              >
                <td className="py-2 pr-4">{r.student_name}</td>
                <td className="py-2 pr-4">{r.program_name}</td>
                <td className="py-2 pr-4">
                  <span className={badgeClass("status", r.registration_status)}>
                    {r.registration_status}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className={badgeClass("payment", r.payment_status ?? "unpaid")}>
                    {r.payment_status ?? "unpaid"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="text-charcoal">{r.guardian_name}</div>
                  <div className="text-charcoal/60 text-xs">{r.guardian_email}</div>
                </td>
                <td className="py-2">{r.created_at}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-charcoal/60">
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

