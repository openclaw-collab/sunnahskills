import React, { useEffect, useState } from "react";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { ClayButton } from "@/components/brand/ClayButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [replyingTo, setReplyingTo] = useState<ContactRow | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyStatus, setReplyStatus] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contacts");
      if (!res.ok) {
        console.error("Failed to load contacts:", res.status);
        return;
      }
      const json = (await res.json().catch(() => null)) as any;
      setContacts((json?.contacts ?? []) as ContactRow[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function startReply(contact: ContactRow) {
    setReplyingTo(contact);
    setSubject(`Re: Sunnah Skills`);
    setMessage("");
    setReplyStatus(null);
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!replyingTo) return;

    setSending(true);
    setReplyStatus(null);
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: replyingTo.id,
          subject,
          message,
        }),
      });
      if (!res.ok) throw new Error("Reply could not be sent.");
      setReplyStatus("Reply sent.");
      setMessage("");
    } catch {
      setReplyStatus("Reply could not be sent.");
    } finally {
      setSending(false);
    }
  }

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
              <th className="text-left py-2 pr-4">Time</th>
              <th className="text-left py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <React.Fragment key={c.id}>
                <tr className="border-b border-charcoal/5">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">{c.email}</td>
                  <td className="py-2 pr-4 max-w-[480px]">
                    <div className="line-clamp-2 text-charcoal/80">{c.message}</div>
                  </td>
                  <td className="py-2 pr-4">{c.timestamp}</td>
                  <td className="py-2">
                    <OutlineButton
                      className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                      onClick={() => startReply(c)}
                      aria-label={`Reply to ${c.name}`}
                    >
                      Reply
                    </OutlineButton>
                  </td>
                </tr>
                {replyingTo?.id === c.id ? (
                  <tr className="border-b border-charcoal/10">
                    <td colSpan={5} className="py-4">
                      <form onSubmit={sendReply} className="rounded-[1.4rem] border border-moss/15 bg-cream/35 p-4">
                        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss">
                          Reply to {c.name}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
                          <label className="space-y-2 text-sm text-charcoal">
                            <span>Subject</span>
                            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
                          </label>
                          <label className="space-y-2 text-sm text-charcoal">
                            <span>Message</span>
                            <Textarea
                              value={message}
                              onChange={(event) => setMessage(event.target.value)}
                              rows={4}
                              placeholder="Write a clear reply for this parent."
                            />
                          </label>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <ClayButton
                            type="submit"
                            className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                            disabled={sending || message.trim().length < 2}
                          >
                            {sending ? "Sending..." : "Send reply"}
                          </ClayButton>
                          <OutlineButton
                            type="button"
                            className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                            onClick={() => setReplyingTo(null)}
                          >
                            Cancel
                          </OutlineButton>
                          {replyStatus ? <span className="text-sm text-moss">{replyStatus}</span> : null}
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-charcoal/60">
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
