import React, { useEffect, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";

type Offer = {
  id: number;
  program_id: string;
  name: string;
  confirmation_notes: string | null;
  is_private: number;
  access_code: string | null;
  active: number;
  audience_gender: string | null;
  dates: string[];
};

type Program = {
  id: string;
  name: string;
  slug: string;
};

const INITIAL_FORM = {
  programId: "archery",
  name: "",
  sessionName: "",
  season: "",
  dayOfWeek: "Sunday",
  startTime: "",
  endTime: "",
  startDate: "",
  endDate: "",
  datesText: "",
  capacity: "15",
  amount: "",
  frequency: "per_series",
  audienceGender: "all",
  confirmationNotes: "",
  isPrivate: false,
};

export function OffersManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [offersRes, programsRes] = await Promise.all([fetch("/api/admin/offers"), fetch("/api/admin/programs")]);
      const offersJson = (await offersRes.json().catch(() => null)) as { offers?: Offer[] } | null;
      const programsJson = (await programsRes.json().catch(() => null)) as { programs?: Program[] } | null;
      setOffers((offersJson?.offers ?? []) as Offer[]);
      setPrograms((programsJson?.programs ?? []) as Program[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createOffer() {
    setSaving(true);
    setFeedback(null);
    try {
      const dates = form.datesText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: form.programId,
          name: form.name,
          isPrivate: form.isPrivate,
          sessionName: form.sessionName || form.name,
          season: form.season,
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          startDate: form.startDate,
          endDate: form.endDate,
          dates,
          capacity: Number(form.capacity),
          amount: Math.round(Number(form.amount || 0) * 100),
          frequency: form.frequency,
          audienceGender: form.audienceGender === "all" ? "" : form.audienceGender,
          confirmationNotes: form.confirmationNotes,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { offer?: Offer; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not create offer.");
      }
      setFeedback(
        payload?.offer?.access_code
          ? `Offer created. Access code: ${payload.offer.access_code}`
          : "Offer created.",
      );
      setForm(INITIAL_FORM);
      await refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not create offer.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    await fetch("/api/admin/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: offer.id, active: offer.active ? 0 : 1 }),
    });
    await refresh();
  }

  return (
    <PremiumCard className="bg-white border border-charcoal/10">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Offers</div>
          <div className="font-body text-sm text-charcoal/70 mt-1">
            Create public or private offers, generate access codes, and toggle offer availability.
          </div>
        </div>
        <OutlineButton
          className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </OutlineButton>
      </div>

      <div className="rounded-[1.5rem] border border-charcoal/10 bg-cream/40 p-4 mb-6 space-y-4">
        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">Create offer</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm text-charcoal">
            Program
            <select
              className="mt-2 w-full rounded-xl border border-charcoal/10 bg-white px-4 py-2.5"
              value={form.programId}
              onChange={(event) => setForm((prev) => ({ ...prev, programId: event.target.value }))}
            >
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-charcoal">
            Offer name
            <Input className="mt-2 bg-white border-charcoal/10" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label className="text-sm text-charcoal">
            Session name
            <Input className="mt-2 bg-white border-charcoal/10" value={form.sessionName} onChange={(event) => setForm((prev) => ({ ...prev, sessionName: event.target.value }))} />
          </label>
          <label className="text-sm text-charcoal">
            Season / date label
            <Input className="mt-2 bg-white border-charcoal/10" value={form.season} onChange={(event) => setForm((prev) => ({ ...prev, season: event.target.value }))} placeholder="May 10, 17, 24, 31" />
          </label>
          <label className="text-sm text-charcoal">
            Dates (comma-separated)
            <Input className="mt-2 bg-white border-charcoal/10" value={form.datesText} onChange={(event) => setForm((prev) => ({ ...prev, datesText: event.target.value }))} placeholder="2026-05-10, 2026-05-17" />
          </label>
          <label className="text-sm text-charcoal">
            Audience
            <select
              className="mt-2 w-full rounded-xl border border-charcoal/10 bg-white px-4 py-2.5"
              value={form.audienceGender}
              onChange={(event) => setForm((prev) => ({ ...prev, audienceGender: event.target.value }))}
            >
              <option value="all">All</option>
              <option value="female">Female only</option>
              <option value="male">Male only</option>
            </select>
          </label>
          <label className="text-sm text-charcoal">
            Day
            <Input className="mt-2 bg-white border-charcoal/10" value={form.dayOfWeek} onChange={(event) => setForm((prev) => ({ ...prev, dayOfWeek: event.target.value }))} />
          </label>
          <label className="text-sm text-charcoal">
            Start time
            <Input className="mt-2 bg-white border-charcoal/10" value={form.startTime} onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))} placeholder="10:00" />
          </label>
          <label className="text-sm text-charcoal">
            End time
            <Input className="mt-2 bg-white border-charcoal/10" value={form.endTime} onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))} placeholder="12:00" />
          </label>
          <label className="text-sm text-charcoal">
            Start date
            <Input className="mt-2 bg-white border-charcoal/10" type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} />
          </label>
          <label className="text-sm text-charcoal">
            End date
            <Input className="mt-2 bg-white border-charcoal/10" type="date" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} />
          </label>
          <label className="text-sm text-charcoal">
            Capacity
            <Input className="mt-2 bg-white border-charcoal/10" type="number" value={form.capacity} onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))} />
          </label>
          <label className="text-sm text-charcoal">
            Price (CAD)
            <Input className="mt-2 bg-white border-charcoal/10" type="number" step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
          </label>
          <label className="text-sm text-charcoal">
            Frequency
            <select
              className="mt-2 w-full rounded-xl border border-charcoal/10 bg-white px-4 py-2.5"
              value={form.frequency}
              onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))}
            >
              <option value="per_series">Per series</option>
              <option value="per_workshop">Per workshop</option>
              <option value="per_session">Per session</option>
            </select>
          </label>
        </div>
        <label className="block text-sm text-charcoal">
          Confirmation notes
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-charcoal/10 bg-white px-4 py-3"
            value={form.confirmationNotes}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmationNotes: event.target.value }))}
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-charcoal">
          <input
            type="checkbox"
            checked={form.isPrivate}
            onChange={(event) => setForm((prev) => ({ ...prev, isPrivate: event.target.checked }))}
          />
          Private offer (generate an access code)
        </label>
        {feedback ? <div className="rounded-xl border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-charcoal">{feedback}</div> : null}
        <ClayButton className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={() => void createOffer()} disabled={saving}>
          {saving ? "Saving…" : "Create offer"}
        </ClayButton>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-2xl border border-charcoal/10 bg-cream/35 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-heading text-lg text-charcoal">{offer.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                  {offer.program_id} · {offer.is_private ? "Private" : "Public"} · {offer.active ? "Active" : "Inactive"}
                </div>
                <div className="mt-2 text-sm text-charcoal/70">
                  {offer.dates?.length ? offer.dates.join(", ") : "No structured dates yet"}
                </div>
                {offer.access_code ? (
                  <div className="mt-2 font-mono-label text-[12px] text-clay">Access code: {offer.access_code}</div>
                ) : null}
              </div>
              <OutlineButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => void toggleOffer(offer)}>
                {offer.active ? "Disable" : "Enable"}
              </OutlineButton>
            </div>
          </div>
        ))}
        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-4 text-sm text-charcoal/60">
            No offers created yet.
          </div>
        ) : null}
      </div>
    </PremiumCard>
  );
}
