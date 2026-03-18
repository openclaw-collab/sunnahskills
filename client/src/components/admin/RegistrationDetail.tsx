import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Detail = Record<string, any>;

function row(label: string, value: React.ReactNode) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-charcoal/5 last:border-b-0">
      <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/60">
        {label}
      </div>
      <div className="md:col-span-2 text-sm text-charcoal">{value}</div>
    </div>
  );
}

export function RegistrationDetail({
  registrationId,
  open,
  onOpenChange,
  onUpdated,
}: {
  registrationId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<string>("submitted");
  const [adminNotes, setAdminNotes] = useState<string>("");

  useEffect(() => {
    if (!open || !registrationId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/registrations/${registrationId}`);
        const json = (await res.json().catch(() => null)) as any;
        const r = json?.registration ?? null;
        setDetail(r);
        setStatus(r?.status ?? "submitted");
        setAdminNotes(r?.admin_notes ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, registrationId]);

  const title = useMemo(() => {
    if (!detail) return "Registration";
    return `${detail.student_full_name ?? "Student"} • ${detail.program_name ?? "Program"} • #${detail.id}`;
  }, [detail]);

  async function save() {
    if (!registrationId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Update failed");
      onUpdated();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cream border border-charcoal/10 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-charcoal">{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="text-sm text-charcoal/70">Loading…</div>
          </PremiumCard>
        ) : !detail ? (
          <PremiumCard className="bg-white border border-charcoal/10">
            <div className="text-sm text-charcoal/70">No detail available.</div>
          </PremiumCard>
        ) : (
          <div className="space-y-4">
            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                    Update
                  </div>
                  <div className="space-y-2">
                    <div className="font-body text-sm text-charcoal">Status</div>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="bg-cream/50 border-charcoal/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">submitted</SelectItem>
                        <SelectItem value="pending_payment">pending_payment</SelectItem>
                        <SelectItem value="paid">paid</SelectItem>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="waitlisted">waitlisted</SelectItem>
                        <SelectItem value="cancelled">cancelled</SelectItem>
                        <SelectItem value="refunded">refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="font-body text-sm text-charcoal">Admin notes</div>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="bg-cream/50 border-charcoal/10"
                      placeholder="Internal notes…"
                    />
                  </div>
                </div>

                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                    Payment
                  </div>
                  {row("Payment status", detail.payment_status ?? "unpaid")}
                  {row("Amount", detail.payment_amount ?? "—")}
                  {row("Currency", (detail.payment_currency ?? "usd").toUpperCase?.() ?? "USD")}
                  {row("Stripe PI", detail.stripe_payment_intent_id ?? "—")}
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                Guardian & student
              </div>
              {row("Guardian", detail.guardian_full_name)}
              {row("Email", detail.guardian_email)}
              {row("Phone", detail.guardian_phone)}
              {row("Emergency", `${detail.guardian_emergency_contact_name ?? "—"} • ${detail.guardian_emergency_contact_phone ?? "—"}`)}
              {row("Relationship", detail.guardian_relationship ?? "—")}
              {row("Student", `${detail.student_full_name ?? "—"} (${detail.student_preferred_name ?? "—"})`)}
              {row("DOB / Age", `${detail.student_dob ?? "—"} • ${detail.student_age ?? "—"}`)}
              {row("Gender", detail.student_gender ?? "—")}
              {row("Experience", detail.student_prior_experience ?? "—")}
              {row("Skill level", detail.student_skill_level ?? "—")}
              {row("Medical notes", detail.student_medical_notes ?? "—")}
            </PremiumCard>

            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                Waivers
              </div>
              {row("Liability", detail.waiver_liability_waiver ? "Yes" : "No")}
              {row("Photo consent", detail.waiver_photo_consent ? "Yes" : "No")}
              {row("Medical consent", detail.waiver_medical_consent ? "Yes" : "No")}
              {row("Terms", detail.waiver_terms_agreement ? "Yes" : "No")}
              {row("Signature", detail.waiver_signature_text ?? "—")}
              {row("Signed at", detail.waiver_signed_at ?? "—")}
            </PremiumCard>

            <div className="flex items-center justify-end gap-2">
              <OutlineButton
                className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                onClick={() => onOpenChange(false)}
              >
                Close
              </OutlineButton>
              <ClayButton
                className="px-6 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </ClayButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

