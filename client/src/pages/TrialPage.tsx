import React from "react";
import { Link } from "wouter";
import { MotionPage } from "@/components/motion/PageMotion";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TrialPage() {
  const [form, setForm] = React.useState({
    accountHolderName: "",
    email: "",
    phone: "",
    participantType: "child" as "self" | "child",
    participantName: "",
    participantAge: "",
    participantGender: "",
    desiredDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          participantAge: Number(form.participantAge),
          programId: "bjj",
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Could not book the free trial.");
      setMessage(json?.message ?? "Free trial booked. Check your email for the QR code.");
      setForm({
        accountHolderName: "",
        email: "",
        phone: "",
        participantType: "child",
        participantName: "",
        participantAge: "",
        participantGender: "",
        desiredDate: "",
        notes: "",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not book the free trial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-4xl px-6 pt-28">
        <SectionHeader
          eyebrow="Free Trial"
          title="Start with one calm first class"
          className="mb-6"
        />
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-charcoal/70">
          Book a no-pressure Brazilian Jiu-Jitsu trial first. We&apos;ll send a confirmation email with a QR code for check-in,
          and if you enroll after a verified trial, we&apos;ll credit one class automatically.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-charcoal">
                Account holder full name
                <Input
                  className="mt-2 bg-cream/50 border-charcoal/10"
                  value={form.accountHolderName}
                  onChange={(event) => setForm((prev) => ({ ...prev, accountHolderName: event.target.value }))}
                />
              </label>
              <label className="text-sm text-charcoal">
                Email
                <Input
                  className="mt-2 bg-cream/50 border-charcoal/10"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
              <label className="text-sm text-charcoal">
                Phone
                <Input
                  className="mt-2 bg-cream/50 border-charcoal/10"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </label>
              <label className="text-sm text-charcoal">
                Participant type
                <Select
                  value={form.participantType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, participantType: value as "self" | "child" }))}
                >
                  <SelectTrigger className="mt-2 bg-cream/50 border-charcoal/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="self">Myself</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="text-sm text-charcoal">
                Participant full name
                <Input
                  className="mt-2 bg-cream/50 border-charcoal/10"
                  value={form.participantName}
                  onChange={(event) => setForm((prev) => ({ ...prev, participantName: event.target.value }))}
                />
              </label>
              <label className="text-sm text-charcoal">
                Participant age
                <Input
                  className="mt-2 bg-cream/50 border-charcoal/10"
                  type="number"
                  value={form.participantAge}
                  onChange={(event) => setForm((prev) => ({ ...prev, participantAge: event.target.value }))}
                />
              </label>
              <label className="text-sm text-charcoal">
                Participant gender
                <Select
                  value={form.participantGender}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, participantGender: value }))}
                >
                  <SelectTrigger className="mt-2 bg-cream/50 border-charcoal/10">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="text-sm text-charcoal">
                Trial date
                <Input
                  className="mt-2 bg-cream/50 border-charcoal/10"
                  type="date"
                  value={form.desiredDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, desiredDate: event.target.value }))}
                />
              </label>
              <label className="text-sm text-charcoal md:col-span-2">
                Notes (optional)
                <Textarea
                  className="mt-2 min-h-[110px] bg-cream/50 border-charcoal/10"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </label>
            </div>

            {error ? <div className="mt-4 text-sm text-clay">{error}</div> : null}
            {message ? <div className="mt-4 text-sm text-moss">{message}</div> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <ClayButton
                className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                disabled={submitting}
                onClick={submit}
              >
                {submitting ? "Booking..." : "Book free trial"}
              </ClayButton>
              <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register">Go to registration</Link>
              </OutlineButton>
            </div>
          </PremiumCard>

          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">What happens next</div>
            <div className="space-y-4 text-sm leading-relaxed text-charcoal/75">
              <p>1. We confirm your BJJ trial date and email your QR code.</p>
              <p>2. Staff scan the QR code at the studio to verify the class was used.</p>
              <p>3. If you decide to continue, you can create a Family &amp; Member Account and register with less friction.</p>
              <p>4. Verified trials automatically count as one class credit when the same participant enrolls.</p>
            </div>
          </PremiumCard>
        </div>
      </main>
    </MotionPage>
  );
}
