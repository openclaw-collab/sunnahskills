import React, { useEffect, useMemo, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";

type Program = { id: string; name: string; slug: string };
type Price = {
  id: number;
  program_id: string;
  age_group: string;
  label: string;
  amount: number;
  frequency: string;
  registration_fee: number;
  metadata?: string | null;
  active: number;
};

type SemesterRow = {
  id: number;
  name: string;
  program_id: string;
  start_date: string | null;
  end_date: string | null;
  classes_in_semester: number;
  price_per_class_cents: number | null;
  registration_fee_cents: number | null;
  later_payment_date: string | null;
  active: number;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export function PricingManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [semesters, setSemesters] = useState<SemesterRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([fetch("/api/admin/programs"), fetch("/api/admin/semesters")]);
      const json = (await pRes.json().catch(() => null)) as any;
      setPrograms((json?.programs ?? []) as Program[]);
      setPrices((json?.prices ?? []) as Price[]);
      const sjson = (await sRes.json().catch(() => null)) as any;
      setSemesters((sjson?.semesters ?? []) as SemesterRow[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const byProgram = useMemo(() => {
    const map = new Map<string, Price[]>();
    for (const p of prices) {
      map.set(p.program_id, [...(map.get(p.program_id) ?? []), p]);
    }
    return map;
  }, [prices]);

  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Pricing</div>
          <div className="font-body text-sm text-charcoal/70 mt-1">
            Edit price tiers (cents) and toggle active. Changes apply to new registrations.
          </div>
        </div>
        <OutlineButton
          className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </OutlineButton>
      </div>

      {semesters.length > 0 ? (
        <div className="mb-8 rounded-[1.5rem] border border-moss/20 bg-moss/5 p-4">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Semesters (BJJ totals)</div>
          <div className="space-y-4">
            {semesters.map((sem) => (
              <SemesterEditor key={sem.id} semester={sem} onSaved={refresh} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {programs.map((prog) => {
          const tiers = byProgram.get(prog.id) ?? [];
          return (
            <div key={prog.id} className="rounded-[1.5rem] border border-charcoal/10 bg-cream/40 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div>
                  <div className="font-display text-lg text-charcoal">{prog.name}</div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mt-1">
                    {prog.id} • /programs/{prog.slug}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-charcoal/60">
                    <tr className="border-b border-charcoal/10">
                      <th className="text-left py-2 pr-4">Tier</th>
                      <th className="text-left py-2 pr-4">Frequency</th>
                      <th className="text-left py-2 pr-4">Amount</th>
                      <th className="text-left py-2 pr-4">Reg fee</th>
                      <th className="text-left py-2 pr-4">Stripe price</th>
                      <th className="text-left py-2 pr-4">Active</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((t) => (
                      <PriceRow
                        key={t.id}
                        tier={t}
                        onSave={async (next) => {
                          await fetch("/api/admin/programs", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              priceId: t.id,
                              amount: next.amount,
                              registrationFee: next.registration_fee,
                              stripePriceId: next.stripe_price_id,
                              active: next.active,
                            }),
                          });
                          await refresh();
                        }}
                      />
                    ))}
                    {tiers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-charcoal/60">
                          No price tiers found for this program.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </PremiumCard>
  );
}

function SemesterEditor({ semester, onSaved }: { semester: SemesterRow; onSaved: () => Promise<void> }) {
  const [classesN, setClassesN] = useState(String(semester.classes_in_semester));
  const [ppc, setPpc] = useState(String(semester.price_per_class_cents ?? ""));
  const [regFee, setRegFee] = useState(String(semester.registration_fee_cents ?? 0));
  const [later, setLater] = useState(semester.later_payment_date ?? "");
  const [start, setStart] = useState(semester.start_date ?? "");
  const [end, setEnd] = useState(semester.end_date ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-body font-medium text-charcoal">{semester.name}</div>
          <div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-charcoal/50">
            {semester.program_id} · id {semester.id} {semester.active ? "· active" : ""}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-charcoal/70">
          Classes in semester
          <Input value={classesN} onChange={(e) => setClassesN(e.target.value)} type="number" className="mt-1 bg-white" />
        </label>
        <label className="text-xs text-charcoal/70">
          Price / class (¢)
          <Input value={ppc} onChange={(e) => setPpc(e.target.value)} type="number" className="mt-1 bg-white" />
        </label>
        <label className="text-xs text-charcoal/70">
          Registration fee (¢)
          <Input value={regFee} onChange={(e) => setRegFee(e.target.value)} type="number" className="mt-1 bg-white" />
        </label>
        <label className="text-xs text-charcoal/70">
          Later payment date
          <Input value={later} onChange={(e) => setLater(e.target.value)} placeholder="YYYY-MM-DD" className="mt-1 bg-white" />
        </label>
        <label className="text-xs text-charcoal/70">
          Start date
          <Input value={start} onChange={(e) => setStart(e.target.value)} placeholder="YYYY-MM-DD" className="mt-1 bg-white" />
        </label>
        <label className="text-xs text-charcoal/70">
          End date
          <Input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="YYYY-MM-DD" className="mt-1 bg-white" />
        </label>
      </div>
      <div className="mt-3">
        <ClayButton
          className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await fetch("/api/admin/semesters", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: semester.id,
                  classesInSemester: Number(classesN || 12),
                  pricePerClassCents: ppc === "" ? null : Number(ppc),
                  registrationFeeCents: Number(regFee || 0),
                  laterPaymentDate: later.trim() || null,
                  startDate: start.trim() || null,
                  endDate: end.trim() || null,
                }),
              });
              await onSaved();
            } finally {
              setSaving(false);
            }
          }}
        >
          Save semester
        </ClayButton>
      </div>
    </div>
  );
}

function PriceRow({
  tier,
  onSave,
}: {
  tier: Price;
  onSave: (next: Price & { stripe_price_id?: string | null }) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(tier.amount));
  const [fee, setFee] = useState(String(tier.registration_fee ?? 0));
  const [stripePriceId, setStripePriceId] = useState(() => {
    try {
      return String(JSON.parse(tier.metadata ?? "{}")?.stripe_price_id ?? "");
    } catch {
      return "";
    }
  });
  const [saving, setSaving] = useState(false);

  return (
    <tr className="border-b border-charcoal/5">
      <td className="py-2 pr-4">
        <div className="text-charcoal">{tier.label}</div>
        <div className="text-xs text-charcoal/60">{tier.age_group}</div>
      </td>
      <td className="py-2 pr-4">{tier.frequency}</td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            className="w-32 bg-white border-charcoal/10"
          />
          <div className="text-xs text-charcoal/60">{money(Number(amount || 0))}</div>
        </div>
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          <Input
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            type="number"
            className="w-32 bg-white border-charcoal/10"
          />
          <div className="text-xs text-charcoal/60">{money(Number(fee || 0))}</div>
        </div>
      </td>
      <td className="py-2 pr-4">
        <Input
          value={stripePriceId}
          onChange={(e) => setStripePriceId(e.target.value)}
          placeholder="price_..."
          className="w-40 bg-white border-charcoal/10"
        />
      </td>
      <td className="py-2 pr-4">{tier.active ? "Yes" : "No"}</td>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <OutlineButton
            className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({
                  ...tier,
                  amount: Number(amount || 0),
                  registration_fee: Number(fee || 0),
                  stripe_price_id: stripePriceId.trim() || null,
                  active: tier.active ? 0 : 1,
                });
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {tier.active ? "Disable" : "Enable"}
          </OutlineButton>
          <ClayButton
            className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({
                  ...tier,
                  amount: Number(amount || 0),
                  registration_fee: Number(fee || 0),
                  stripe_price_id: stripePriceId.trim() || null,
                });
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            Save
          </ClayButton>
        </div>
      </td>
    </tr>
  );
}
