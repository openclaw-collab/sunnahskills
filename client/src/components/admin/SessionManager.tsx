import React, { useEffect, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { OutlineButton } from "@/components/brand/OutlineButton";

type Session = {
  id: number;
  program_id: string;
  name: string;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  age_group: string | null;
  capacity: number | null;
  enrolled_count: number;
  status: string;
  visible: number;
};

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/programs");
      const json = (await res.json().catch(() => null)) as any;
      const flat = (json?.sessions ?? []) as Session[];
      setSessions(flat);
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
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Sessions</div>
          <div className="font-body text-sm text-charcoal/70 mt-1">
            Toggle visibility and status. Enrollment counts update when payments succeed.
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-charcoal/60">
            <tr className="border-b border-charcoal/10">
              <th className="text-left py-2 pr-4">Session</th>
              <th className="text-left py-2 pr-4">Age group</th>
              <th className="text-left py-2 pr-4">Capacity</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2 pr-4">Visible</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-charcoal/5">
                <td className="py-2 pr-4">
                  <div className="text-charcoal">{s.name}</div>
                  <div className="text-xs text-charcoal/60">
                    {s.day_of_week ?? "—"} • {s.start_time ?? "—"}–{s.end_time ?? "—"}
                  </div>
                </td>
                <td className="py-2 pr-4">{s.age_group ?? "—"}</td>
                <td className="py-2 pr-4">
                  {s.enrolled_count ?? 0}
                  {typeof s.capacity === "number" ? ` / ${s.capacity}` : ""}
                </td>
                <td className="py-2 pr-4">{s.status}</td>
                <td className="py-2 pr-4">{s.visible ? "Yes" : "No"}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <OutlineButton
                      className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                      onClick={async () => {
                        await fetch("/api/admin/sessions", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sessionId: s.id, visible: s.visible ? 0 : 1 }),
                        });
                        await refresh();
                      }}
                    >
                      {s.visible ? "Hide" : "Show"}
                    </OutlineButton>
                    <OutlineButton
                      className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                      onClick={async () => {
                        const next = s.status === "active" ? "waitlist_only" : "active";
                        await fetch("/api/admin/sessions", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sessionId: s.id, status: next }),
                        });
                        await refresh();
                      }}
                    >
                      Toggle status
                    </OutlineButton>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-charcoal/60">
                  No sessions found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}

