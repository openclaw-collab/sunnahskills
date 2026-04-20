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

type TrialFieldErrors = Partial<Record<
  | "accountHolderName"
  | "email"
  | "phone"
  | "participantName"
  | "participantAge"
  | "participantGender"
  | "desiredDate",
  string
>>;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fieldClass(error?: string) {
  return error ? "border-clay/70 bg-clay/5 focus-visible:ring-clay/35" : "bg-cream/50 border-charcoal/10";
}

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
  const [messageTone, setMessageTone] = React.useState<"success" | "warning">("success");
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<TrialFieldErrors>({});

  function validate() {
    const nextErrors: TrialFieldErrors = {};
    if (form.accountHolderName.trim().length < 2) nextErrors.accountHolderName = "Full name is required.";
    if (!isValidEmail(form.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (form.phone.trim().length < 7) nextErrors.phone = "Phone number is required.";
    if (form.participantName.trim().length < 2) nextErrors.participantName = "Participant name is required.";
    const participantAge = Number(form.participantAge);
    if (!Number.isFinite(participantAge) || participantAge < 5) nextErrors.participantAge = "Enter a valid age.";
    if (!form.participantGender.trim()) nextErrors.participantGender = "Gender is required.";
    if (!form.desiredDate.trim()) nextErrors.desiredDate = "Choose a trial date.";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!validate()) {
      setError("Fill out all required fields to book your trial.");
      setMessage(null);
      return;
    }
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
      const json = (await res.json().catch(() => null)) as { error?: string; message?: string; emailSent?: boolean } | null;
      if (!res.ok) throw new Error(json?.error ?? "Could not book the free trial.");
      setMessageTone(json?.emailSent === false ? "warning" : "success");
      setMessage(json?.message ?? "Free trial booked. Check your email for the QR code.");
      setFieldErrors({});
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
      setError(caught instanceof Error ? caught.message : "Couldn't book your trial. Try again or contact us for help.");
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
          and if you enroll after a verified visit, we&apos;ll credit one class automatically.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-charcoal">
                Account holder full name <span className="text-clay">*</span>
                <Input
                  className={`mt-2 ${fieldClass(fieldErrors.accountHolderName)}`}
                  value={form.accountHolderName}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, accountHolderName: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, accountHolderName: undefined }));
                  }}
                />
                {fieldErrors.accountHolderName ? <div className="mt-1 text-xs text-clay">{fieldErrors.accountHolderName}</div> : null}
              </label>
              <label className="text-sm text-charcoal">
                Email <span className="text-clay">*</span>
                <Input
                  className={`mt-2 ${fieldClass(fieldErrors.email)}`}
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, email: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                />
                {fieldErrors.email ? <div className="mt-1 text-xs text-clay">{fieldErrors.email}</div> : null}
              </label>
              <label className="text-sm text-charcoal">
                Phone <span className="text-clay">*</span>
                <Input
                  className={`mt-2 ${fieldClass(fieldErrors.phone)}`}
                  type="tel"
                  value={form.phone}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, phone: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                />
                {fieldErrors.phone ? <div className="mt-1 text-xs text-clay">{fieldErrors.phone}</div> : null}
              </label>
              <label className="text-sm text-charcoal">
                Participant type <span className="text-clay">*</span>
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
                Participant full name <span className="text-clay">*</span>
                <Input
                  className={`mt-2 ${fieldClass(fieldErrors.participantName)}`}
                  value={form.participantName}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, participantName: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, participantName: undefined }));
                  }}
                />
                {fieldErrors.participantName ? <div className="mt-1 text-xs text-clay">{fieldErrors.participantName}</div> : null}
              </label>
              <label className="text-sm text-charcoal">
                Participant age <span className="text-clay">*</span>
                <Input
                  className={`mt-2 ${fieldClass(fieldErrors.participantAge)}`}
                  type="number"
                  value={form.participantAge}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, participantAge: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, participantAge: undefined }));
                  }}
                />
                {fieldErrors.participantAge ? <div className="mt-1 text-xs text-clay">{fieldErrors.participantAge}</div> : null}
              </label>
              <label className="text-sm text-charcoal">
                Participant gender <span className="text-clay">*</span>
                <Select
                  value={form.participantGender}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, participantGender: value }));
                    setFieldErrors((prev) => ({ ...prev, participantGender: undefined }));
                  }}
                >
                  <SelectTrigger className={`mt-2 ${fieldClass(fieldErrors.participantGender)}`}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.participantGender ? <div className="mt-1 text-xs text-clay">{fieldErrors.participantGender}</div> : null}
              </label>
              <label className="text-sm text-charcoal">
                Trial date <span className="text-clay">*</span>
                <Input
                  className={`mt-2 ${fieldClass(fieldErrors.desiredDate)}`}
                  type="date"
                  value={form.desiredDate}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, desiredDate: event.target.value }));
                    setFieldErrors((prev) => ({ ...prev, desiredDate: undefined }));
                  }}
                />
                {fieldErrors.desiredDate ? <div className="mt-1 text-xs text-clay">{fieldErrors.desiredDate}</div> : null}
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
            {message ? (
              <div className={`mt-4 text-sm ${messageTone === "warning" ? "text-yellow-800" : "text-moss"}`}>{message}</div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <ClayButton
                className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                disabled={submitting}
                onClick={submit}
              >
                {submitting ? "Booking..." : "Reserve free trial"}
              </ClayButton>
              <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register">Sign in instead</Link>
              </OutlineButton>
            </div>
          </PremiumCard>

          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">What happens next</div>
            <div className="space-y-4 text-sm leading-relaxed text-charcoal/75">
              <p>1. We confirm the trial date and email your QR code.</p>
              <p>2. Staff scan the QR code at the studio to verify the class was used.</p>
              <p>3. If you decide to continue, open a Family &amp; Member Account and add the same participant profile.</p>
              <p>4. Verified trials automatically count as one class credit when that participant enrolls.</p>
            </div>
          </PremiumCard>
        </div>
      </main>
    </MotionPage>
  );
}
