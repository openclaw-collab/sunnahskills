import React, { useEffect, useMemo, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";

type TrialBooking = {
  id: number;
  account_holder_name: string;
  email: string;
  participant_full_name: string;
  participant_type: string;
  participant_gender: string;
  participant_age: number;
  desired_date: string;
  status: string;
  verified_at: string | null;
};

export function TrialsManager() {
  const [trials, setTrials] = useState<TrialBooking[]>([]);
  const [highlighted, setHighlighted] = useState<TrialBooking | null>(null);
  const [loading, setLoading] = useState(false);

  const trialToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("trialToken") ?? "";
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const [listRes, tokenRes] = await Promise.all([
        fetch("/api/admin/trials"),
        trialToken ? fetch(`/api/admin/trials?trialToken=${encodeURIComponent(trialToken)}`) : Promise.resolve(null),
      ]);
      const listJson = (await listRes.json().catch(() => null)) as { trials?: TrialBooking[] } | null;
      setTrials(listJson?.trials ?? []);

      if (tokenRes) {
        const tokenJson = (await tokenRes.json().catch(() => null)) as { booking?: TrialBooking | null } | null;
        setHighlighted(tokenJson?.booking ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function verify(id: number) {
    const res = await fetch("/api/admin/trials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verify: true }),
    });
    if (!res.ok) {
      alert("Failed to verify trial");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-4">
      {highlighted ? (
        <PremiumCard className="border border-clay/20 bg-clay/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay mb-2">Scanned trial</div>
              <div className="text-base font-medium text-charcoal">{highlighted.participant_full_name}</div>
              <div className="mt-1 text-sm text-charcoal/70">
                {highlighted.account_holder_name} · {highlighted.desired_date} · {highlighted.status}
              </div>
            </div>
            <ClayButton className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]" onClick={() => verify(highlighted.id)}>
              Mark verified
            </ClayButton>
          </div>
        </PremiumCard>
      ) : null}

      <PremiumCard className="border border-charcoal/10 bg-white">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Trial bookings</div>
            <div className="mt-1 text-sm text-charcoal/70">Verify trial attendance and track the BJJ free-trial pipeline.</div>
          </div>
          <OutlineButton className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={refresh}>
            {loading ? "Refreshing..." : "Refresh"}
          </OutlineButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-charcoal/60">
              <tr className="border-b border-charcoal/10">
                <th className="text-left py-2 pr-4">Participant</th>
                <th className="text-left py-2 pr-4">Account holder</th>
                <th className="text-left py-2 pr-4">Trial date</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {trials.map((trial) => (
                <tr key={trial.id} className="border-b border-charcoal/5">
                  <td className="py-2 pr-4">
                    <div>{trial.participant_full_name}</div>
                    <div className="text-xs text-charcoal/55">
                      {trial.participant_type} · {trial.participant_gender} · age {trial.participant_age}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div>{trial.account_holder_name}</div>
                    <div className="text-xs text-charcoal/55">{trial.email}</div>
                  </td>
                  <td className="py-2 pr-4">{trial.desired_date}</td>
                  <td className="py-2 pr-4">{trial.verified_at ? "verified" : trial.status}</td>
                  <td className="py-2">
                    <ClayButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => verify(trial.id)}>
                      Verify
                    </ClayButton>
                  </td>
                </tr>
              ))}
              {trials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-charcoal/60">
                    No trial bookings yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </div>
  );
}
