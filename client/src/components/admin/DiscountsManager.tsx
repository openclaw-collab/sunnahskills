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

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
    cents / 100,
  );
}

function formatDiscountValueInput(type: Discount["type"], value: number) {
  if (type === "fixed") {
    const dollars = value / 100;
    return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
  }
  return String(value);
}

function parseDiscountValueInput(type: Discount["type"], value: string) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  if (type === "fixed") return Math.max(0, Math.round(parsed * 100));
  return Math.max(0, Math.round(parsed));
}

function formatDiscountValueDisplay(discount: Discount) {
  if (discount.type === "percentage") return `${discount.value}%`;
  if (discount.type === "fixed") return money(discount.value);
  return "Automatic";
}

function toDateInput(value: string | null) {
  return value ? String(value).slice(0, 10) : "";
}

function toDateTimePayload(value: string) {
  return value.trim() ? `${value.trim()}T00:00:00Z` : null;
}

function DiscountRowEditor({
  discount,
  programs,
  onSaved,
}: {
  discount: Discount;
  programs: Program[];
  onSaved: () => Promise<void>;
}) {
  const [code, setCode] = useState(discount.code);
  const [type, setType] = useState<Discount["type"]>(discount.type);
  const [value, setValue] = useState(formatDiscountValueInput(discount.type, discount.value));
  const [programId, setProgramId] = useState(discount.program_id ?? "all");
  const [maxUses, setMaxUses] = useState(discount.max_uses != null ? String(discount.max_uses) : "");
  const [validFrom, setValidFrom] = useState(toDateInput(discount.valid_from));
  const [validUntil, setValidUntil] = useState(toDateInput(discount.valid_until));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCode(discount.code);
    setType(discount.type);
    setValue(formatDiscountValueInput(discount.type, discount.value));
    setProgramId(discount.program_id ?? "all");
    setMaxUses(discount.max_uses != null ? String(discount.max_uses) : "");
    setValidFrom(toDateInput(discount.valid_from));
    setValidUntil(toDateInput(discount.valid_until));
  }, [discount]);

  async function save(overrides?: Partial<Discount> & { remove?: boolean }) {
    setSaving(true);
    try {
      if (overrides?.remove) {
        await fetch(`/api/admin/discounts?id=${encodeURIComponent(String(discount.id))}`, { method: "DELETE" });
        await onSaved();
        return;
      }

      await fetch("/api/admin/discounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: discount.id,
          code,
          type,
          value: parseDiscountValueInput(type, value),
          programId: programId === "all" ? null : programId,
          maxUses: maxUses.trim() ? Number(maxUses) : null,
          validFrom: toDateTimePayload(validFrom),
          validUntil: toDateTimePayload(validUntil),
          active: overrides?.active ?? discount.active,
        }),
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-charcoal/5 align-top">
      <td className="py-3 pr-4">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-32 bg-white border-charcoal/10" />
      </td>
      <td className="py-3 pr-4">
        <Select value={type} onValueChange={(next) => setType(next as Discount["type"])}>
          <SelectTrigger className="w-36 bg-white border-charcoal/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">percentage</SelectItem>
            <SelectItem value="fixed">fixed</SelectItem>
            <SelectItem value="sibling">sibling</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="py-3 pr-4">
        <div className="space-y-1">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            step={type === "fixed" ? "0.01" : "1"}
            className="w-28 bg-white border-charcoal/10"
          />
          <div className="text-xs text-charcoal/55">
            {type === "percentage" ? `${parseDiscountValueInput(type, value)}% off` : type === "fixed" ? money(parseDiscountValueInput(type, value)) : "Automatic"}
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 text-charcoal/70">
        {discount.current_uses}
        {discount.max_uses ? ` / ${discount.max_uses}` : ""}
      </td>
      <td className="py-3 pr-4">
        <Select value={programId} onValueChange={setProgramId}>
          <SelectTrigger className="w-40 bg-white border-charcoal/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-3 pr-4 text-charcoal/70">{discount.active ? "Yes" : "No"}</td>
      <td className="py-3">
        <div className="flex flex-wrap gap-2">
          <Input
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            type="number"
            placeholder="Max uses"
            className="w-28 bg-white border-charcoal/10"
          />
          <Input value={validFrom} onChange={(e) => setValidFrom(e.target.value)} type="date" className="w-40 bg-white border-charcoal/10" />
          <Input value={validUntil} onChange={(e) => setValidUntil(e.target.value)} type="date" className="w-40 bg-white border-charcoal/10" />
          <OutlineButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => save({ active: discount.active ? 0 : 1 })} disabled={saving}>
            {discount.active ? "Disable" : "Enable"}
          </OutlineButton>
          <ClayButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => save()} disabled={saving}>
            Save
          </ClayButton>
          <OutlineButton
            className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
            onClick={() => {
              if (window.confirm(`Delete discount code ${discount.code}?`)) {
                void save({ remove: true });
              }
            }}
            disabled={saving}
          >
            Delete
          </OutlineButton>
        </div>
      </td>
    </tr>
  );
}

export function DiscountsManager() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [type, setType] = useState<Discount["type"]>("percentage");
  const [value, setValue] = useState("10");
  const [programId, setProgramId] = useState<string>("all");
  const [maxUses, setMaxUses] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([fetch("/api/admin/discounts"), fetch("/api/admin/programs")]);
      const dJson = (await dRes.json().catch(() => null)) as { discounts?: Discount[] } | null;
      const pJson = (await pRes.json().catch(() => null)) as { programs?: Program[] } | null;
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
          <div className="font-body text-sm text-charcoal/70 mt-1">Create, edit, disable, or delete promo codes. Fixed discounts are entered in dollars.</div>
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
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">Code</div>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SPRING10" className="bg-cream/50 border-charcoal/10" />
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">Type</div>
          <Select value={type} onValueChange={(v) => setType(v as Discount["type"])}>
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
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">Value</div>
          <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" step={type === "fixed" ? "0.01" : "1"} className="bg-cream/50 border-charcoal/10" />
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">Program</div>
          <Select value={programId} onValueChange={setProgramId}>
            <SelectTrigger className="bg-cream/50 border-charcoal/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60 mb-2">Max uses</div>
          <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="(optional)" className="bg-cream/50 border-charcoal/10" />
        </div>
      </div>

      <div className="mb-3 text-xs text-charcoal/55">
        Preview: {type === "fixed" ? money(parseDiscountValueInput(type, value)) : type === "percentage" ? `${parseDiscountValueInput(type, value)}% off` : "Automatic"}
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
                value: parseDiscountValueInput(type, value),
                programId: programId === "all" ? null : programId,
                maxUses: maxUses.trim() ? Number(maxUses) : null,
              }),
            });
            if (res.ok) {
              setCode("");
              setValue("10");
              setMaxUses("");
              setProgramId("all");
              setType("percentage");
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
            {discounts.map((discount) => (
              <React.Fragment key={discount.id}>
                <tr className="border-b border-charcoal/5 bg-cream/25">
                  <td className="py-2 pr-4 font-mono-label text-[12px]">{discount.code}</td>
                  <td className="py-2 pr-4">{discount.type}</td>
                  <td className="py-2 pr-4">{formatDiscountValueDisplay(discount)}</td>
                  <td className="py-2 pr-4">
                    {discount.current_uses}
                    {discount.max_uses ? ` / ${discount.max_uses}` : ""}
                  </td>
                  <td className="py-2 pr-4">{discount.program_id ? programs.find((p) => p.id === discount.program_id)?.name ?? discount.program_id : "All"}</td>
                  <td className="py-2 pr-4">{discount.active ? "Yes" : "No"}</td>
                  <td className="py-2 text-charcoal/55">Inline editor below</td>
                </tr>
                <DiscountRowEditor discount={discount} programs={programs} onSaved={refresh} />
              </React.Fragment>
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
