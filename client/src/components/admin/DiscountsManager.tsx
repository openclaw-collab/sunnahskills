import React, { useEffect, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Discount = {
  id: number;
  code: string;
  type: "percentage" | "fixed" | "sibling";
  value: number;
  program_id: string | null;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  active: number;
};

type Program = { id: string; name: string; slug: string };

export function DiscountsManager() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<Discount["type"]>("percentage");
  const [value, setValue] = useState<number>(10);
  const [programId, setProgramId] = useState<string>("all");
  const [maxUses, setMaxUses] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([fetch("/api/admin/discounts"), fetch("/api/admin/programs")]);
      const dJson = (await dRes.json().catch(() => null)) as any;
      const pJson = (await pRes.json().catch(() => null)) as any;
      setDiscounts((dJson?.discounts ?? []) as Discount[]);
      setPrograms((pJson?.programs ?? []) as Program[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Discounts</div>
          <div className="font-body text-sm text-charcoal/70 mt-1">Create promo codes and toggle active state.</div>
        </div>
        <div className="flex items-center gap-2">
          <OutlineButton
            className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </OutlineButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
        <div className="md:col-span-2">
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">
            Code
          </div>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SPRING10" className="bg-cream/50 border-charcoal/10" />
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">
            Type
          </div>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="bg-cream/50 border-charcoal/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">percentage</SelectItem>
              <SelectItem value="fixed">fixed</SelectItem>
              <SelectItem value="sibling">sibling</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">
            Value
          </div>
          <Input
            value={String(value)}
            onChange={(e) => setValue(Number(e.target.value))}
            type="number"
            className="bg-cream/50 border-charcoal/10"
          />
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">
            Program
          </div>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger className="bg-cream/50 border-charcoal/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">
            Max uses
          </div>
          <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="(optional)" className="bg-cream/50 border-charcoal/10" />
        </div>
      </div>

      <div className="flex items-center justify-end mb-6">
        <ClayButton
          className="px-6 py-2.5 text-[11px] uppercase tracking-[0.18em]"
          onClick={async () => {
            const res = await fetch("/api/admin/discounts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code,
                type,
                value,
                programId: programId === "all" ? null : programId,
                maxUses: maxUses.trim() ? Number(maxUses) : null,
              }),
            });
            if (res.ok) {
              setCode("");
              setMaxUses("");
              await refresh();
            }
          }}
        >
          Create discount
        </ClayButton>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-charcoal/60">
            <tr className="border-b border-charcoal/10">
              <th className="text-left py-2 pr-4">Code</th>
              <th className="text-left py-2 pr-4">Type</th>
              <th className="text-left py-2 pr-4">Value</th>
              <th className="text-left py-2 pr-4">Uses</th>
              <th className="text-left py-2 pr-4">Program</th>
              <th className="text-left py-2 pr-4">Active</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="border-b border-charcoal/5">
                <td className="py-2 pr-4 font-mono-label text-[12px]">{d.code}</td>
                <td className="py-2 pr-4">{d.type}</td>
                <td className="py-2 pr-4">{d.value}</td>
                <td className="py-2 pr-4">
                  {d.current_uses}
                  {d.max_uses ? ` / ${d.max_uses}` : ""}
                </td>
                <td className="py-2 pr-4">
                  {d.program_id ? programs.find((p) => p.id === d.program_id)?.name ?? d.program_id : "All"}
                </td>
                <td className="py-2 pr-4">{d.active ? "Yes" : "No"}</td>
                <td className="py-2">
                  <OutlineButton
                    className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                    onClick={async () => {
                      await fetch("/api/admin/discounts", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: d.id, active: d.active ? 0 : 1 }),
                      });
                      await refresh();
                    }}
                  >
                    {d.active ? "Disable" : "Enable"}
                  </OutlineButton>
                </td>
              </tr>
            ))}
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-charcoal/60">
                  No discounts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}

