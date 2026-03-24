import React, { useEffect, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { OutlineButton } from "@/components/brand/OutlineButton";

type ContactRow = {
  id: number;
  name: string;
  email: string;
  message: string;
  timestamp: string;
};

export function ContactsTable() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contacts");
      const json = (await res.json().catch(() => null)) as any;
      setContacts((json?.contacts ?? []) as ContactRow[]);
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
          <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">Contacts</div>
          <div className="font-body text-sm text-charcoal/70 mt-1">Submissions from the contact form.</div>
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
              <th className="text-left py-2 pr-4">Name</th>
              <th className="text-left py-2 pr-4">Email</th>
              <th className="text-left py-2 pr-4">Message</th>
              <th className="text-left py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-b border-charcoal/5">
                <td className="py-2 pr-4">{c.name}</td>
                <td className="py-2 pr-4">{c.email}</td>
                <td className="py-2 pr-4 max-w-[480px]">
                  <div className="line-clamp-2 text-charcoal/80">{c.message}</div>
                </td>
                <td className="py-2">{c.timestamp}</td>
              </tr>
            ))}
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-charcoal/60">
                  No contact submissions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}

