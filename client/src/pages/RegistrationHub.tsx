import React from "react";
import { Link, useLocation } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { MotionPage } from "@/components/motion/PageMotion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useGuardianSession, useGuardianStudents, type SavedStudent } from "@/hooks/useGuardianSession";
import { formatMoneyFromCents } from "@shared/money";

type SignupErrors = Partial<Record<"signupFullName" | "signupEmail", string>>;
type LoginErrors = Partial<Record<"loginEmail", string>>;
type CompletionErrors = Partial<Record<"fullName" | "phone" | "emergencyContactName" | "emergencyContactPhone" | "accountRole", string>>;
type ParticipantErrors = Partial<Record<"participantType" | "fullName" | "dateOfBirth" | "gender", string>>;
type LocalPreview = {
  verifyUrl: string;
  accountNumber?: string | null;
};
type UpcomingFee = {
  orderId: number;
  amountCents: number;
  currency: string;
  chargeDate: string | null;
  programNames: string[];
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fieldClass(error?: string) {
  return error ? "border-clay/70 bg-clay/5 focus-visible:ring-clay/35" : "bg-cream/50 border-charcoal/10";
}

function nextPath() {
  if (typeof window === "undefined") return "/programs/bjj/register";
  const raw = new URLSearchParams(window.location.search).get("next") ?? "/programs/bjj/register";
  return raw.startsWith("/") ? raw : "/programs/bjj/register";
}

function errorMessage() {
  if (typeof window === "undefined") return "";
  const raw = new URLSearchParams(window.location.search).get("error") ?? "";
  if (raw === "invalid_link") return "That sign-in link didn't work. It may have expired or been used already.";
  if (raw === "link_used_or_expired") return "That sign-in link was already used or expired.";
  return "";
}

function ageLabel(participant: SavedStudent) {
  if (!participant.date_of_birth) return "Date of birth required";
  const dob = Date.parse(participant.date_of_birth);
  if (!Number.isFinite(dob)) return participant.date_of_birth;
  const age = Math.floor((Date.now() - dob) / 31557600000);
  return `Age ${Math.max(0, age)}`;
}

export default function RegistrationHub() {
  const [, navigate] = useLocation();
  const targetPath = nextPath();
  const targetProgramLabel = targetPath.includes("/archery") ? "Archery" : "BJJ";
  const sessionQuery = useGuardianSession();
  const participantsQuery = useGuardianStudents(Boolean(sessionQuery.data?.authenticated));
  const [upcomingFees, setUpcomingFees] = React.useState<UpcomingFee[]>([]);

  const [signupFullName, setSignupFullName] = React.useState("");
  const [signupEmail, setSignupEmail] = React.useState("");
  const [loginEmail, setLoginEmail] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState(errorMessage());
  const [messageTone, setMessageTone] = React.useState<"success" | "warning" | "error">(errorMessage() ? "error" : "success");
  const [localPreview, setLocalPreview] = React.useState<LocalPreview | null>(null);
  const [signupErrors, setSignupErrors] = React.useState<SignupErrors>({});
  const [loginErrors, setLoginErrors] = React.useState<LoginErrors>({});

  const [completionForm, setCompletionForm] = React.useState({
    fullName: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    accountRole: "parent_guardian" as "parent_guardian" | "adult_student",
  });
  const [completionErrors, setCompletionErrors] = React.useState<CompletionErrors>({});

  const [participantForm, setParticipantForm] = React.useState({
    participantType: "child" as "self" | "child",
    fullName: "",
    dateOfBirth: "",
    gender: "",
    medicalNotes: "",
  });
  const [participantErrors, setParticipantErrors] = React.useState<ParticipantErrors>({});

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["/api/guardian/me"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/guardian/students"] });
  }

  React.useEffect(() => {
    if (!sessionQuery.data?.authenticated) {
      setUpcomingFees([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/guardian/upcoming-fees", { credentials: "include" });
      const json = (await res.json().catch(() => null)) as { fees?: UpcomingFee[] } | null;
      if (!cancelled && res.ok) setUpcomingFees(json?.fees ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionQuery.data?.authenticated]);

  async function post(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Try again?");
    return json;
  }

  async function patch(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) throw new Error(json?.error ?? "Request failed");
    return json;
  }

  async function destroy(path: string) {
    const res = await fetch(path, { method: "DELETE", credentials: "include" });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) throw new Error(json?.error ?? "Request failed");
    return json;
  }

  const session = sessionQuery.data;
  const authenticated = Boolean(session?.authenticated);
  const accountComplete = Boolean(session?.accountComplete);
  const participants = participantsQuery.data?.students ?? [];

  React.useEffect(() => {
    if (!session) return;
    setCompletionForm({
      fullName: session.fullName ?? "",
      phone: session.phone ?? "",
      emergencyContactName: session.emergencyContactName ?? "",
      emergencyContactPhone: session.emergencyContactPhone ?? "",
      accountRole: (session.accountRole as "parent_guardian" | "adult_student" | undefined) ?? "parent_guardian",
    });
  }, [
    session?.fullName,
    session?.phone,
    session?.emergencyContactName,
    session?.emergencyContactPhone,
    session?.accountRole,
  ]);

  function validateSignup() {
    const nextErrors: SignupErrors = {};
    if (signupFullName.trim().length < 2) nextErrors.signupFullName = "Enter your full name.";
    if (!isValidEmail(signupEmail.trim())) nextErrors.signupEmail = "Enter a valid email.";
    setSignupErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateLogin() {
    const nextErrors: LoginErrors = {};
    if (!isValidEmail(loginEmail.trim())) nextErrors.loginEmail = "Enter a valid email address.";
    setLoginErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateCompletion() {
    const nextErrors: CompletionErrors = {};
    if (completionForm.fullName.trim().length < 2) nextErrors.fullName = "Full name is required.";
    if (completionForm.phone.trim().length < 7) nextErrors.phone = "Phone number is required.";
    if (completionForm.emergencyContactName.trim().length < 2) nextErrors.emergencyContactName = "Emergency contact name is required.";
    if (completionForm.emergencyContactPhone.trim().length < 7) nextErrors.emergencyContactPhone = "Emergency contact phone is required.";
    if (!completionForm.accountRole) nextErrors.accountRole = "Choose who this account is for.";
    setCompletionErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateParticipant() {
    const nextErrors: ParticipantErrors = {};
    if (!participantForm.participantType) nextErrors.participantType = "Choose whether this profile is for yourself or a child.";
    if (participantForm.fullName.trim().length < 2) nextErrors.fullName = "Participant name is required.";
    if (!participantForm.dateOfBirth.trim()) nextErrors.dateOfBirth = "Date of birth is required.";
    if (!participantForm.gender.trim()) nextErrors.gender = "Gender is required.";
    setParticipantErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-6xl px-6 pt-28" data-testid="registration-hub">
        <SectionHeader
          eyebrow="Your Account"
          title={authenticated ? "Account and participant profiles" : "Sign in before you register"}
          className="mb-8"
        />
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-charcoal/70">
          Sign in with your email, add the people you want to register, then choose BJJ or archery.
        </p>

        {message ? (
          <div
            className={`mb-8 rounded-2xl px-4 py-3 text-sm ${
              messageTone === "error"
                ? "border border-clay/20 bg-clay/5 text-clay"
                : messageTone === "warning"
                  ? "border border-yellow-700/15 bg-yellow-50 text-yellow-800"
                  : "border border-moss/20 bg-moss/5 text-moss"
            }`}
          >
            {message}
          </div>
        ) : null}

        {localPreview ? (
          <PremiumCard className="mb-8 border border-yellow-700/15 bg-yellow-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-yellow-800/80 mb-2">Local preview link</div>
                <p className="text-sm leading-relaxed text-yellow-900">
                  Email delivery is unavailable in local preview. Use this secure sign-in link directly while testing the flow.
                </p>
                {localPreview.accountNumber ? (
                  <p className="mt-2 text-sm text-yellow-900/80">Account #{localPreview.accountNumber}</p>
                ) : null}
              </div>
              <a
                href={localPreview.verifyUrl}
                className="inline-flex items-center justify-center rounded-full bg-clay px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-cream transition hover:brightness-95"
              >
                Open local sign-in link
              </a>
            </div>
          </PremiumCard>
        ) : null}

        {!authenticated ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <PremiumCard className="space-y-4 border border-charcoal/10 bg-white p-6">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Create account</div>
                <h2 className="font-heading text-2xl text-charcoal">Create Your Account</h2>
              </div>
              <Input
                value={signupFullName}
                onChange={(event) => {
                  setSignupFullName(event.target.value);
                  setSignupErrors((prev) => ({ ...prev, signupFullName: undefined }));
                }}
                placeholder="Full name"
                className={fieldClass(signupErrors.signupFullName)}
              />
              {signupErrors.signupFullName ? <div className="text-xs text-clay">{signupErrors.signupFullName}</div> : null}
              <Input
                value={signupEmail}
                onChange={(event) => {
                  setSignupEmail(event.target.value);
                  setSignupErrors((prev) => ({ ...prev, signupEmail: undefined }));
                }}
                placeholder="Email"
                type="email"
                className={fieldClass(signupErrors.signupEmail)}
              />
              {signupErrors.signupEmail ? <div className="text-xs text-clay">{signupErrors.signupEmail}</div> : null}
              <ClayButton
                className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                disabled={busy === "signup"}
                onClick={async () => {
                  if (!validateSignup()) {
                    setMessageTone("error");
                    setMessage("Please fill the required account fields before continuing.");
                    return;
                  }
                  setBusy("signup");
                  setMessage("");
                  setLocalPreview(null);
                  try {
                    const json = await post("/api/guardian/signup", {
                      fullName: signupFullName,
                      email: signupEmail,
                      next: targetPath,
                    });
                    const response = json as { message?: string; emailSent?: boolean; localPreview?: LocalPreview } | null;
                    setMessageTone(response?.emailSent === false ? "warning" : "success");
                    setMessage(response?.message ?? "Check your email for the sign-in link.");
                    setLocalPreview(response?.localPreview ?? null);
                  } catch (caught) {
                    setMessageTone("error");
                    setMessage(caught instanceof Error ? caught.message : "Couldn't create your account. Try again or contact support.");
                    setLocalPreview(null);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === "signup" ? "Sending..." : "Email me the sign-in link"}
              </ClayButton>
            </PremiumCard>

            <PremiumCard className="space-y-4 border border-charcoal/10 bg-white p-6">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Sign in</div>
                <h2 className="font-heading text-2xl text-charcoal">Open an existing account</h2>
              </div>
              <Input
                value={loginEmail}
                onChange={(event) => {
                  setLoginEmail(event.target.value);
                  setLoginErrors((prev) => ({ ...prev, loginEmail: undefined }));
                }}
                placeholder="Email"
                type="email"
                className={fieldClass(loginErrors.loginEmail)}
              />
              {loginErrors.loginEmail ? <div className="text-xs text-clay">{loginErrors.loginEmail}</div> : null}
              <OutlineButton
                className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                disabled={busy === "magic-link"}
                onClick={async () => {
                  if (!validateLogin()) {
                    setMessageTone("error");
                    setMessage("Enter the email for the account you want to open.");
                    return;
                  }
                  setBusy("magic-link");
                  setMessage("");
                  setLocalPreview(null);
                  try {
                    const json = await post("/api/guardian/request-link", { email: loginEmail, next: targetPath });
                    const response = json as { message?: string; emailSent?: boolean; localPreview?: LocalPreview } | null;
                    setMessageTone(response?.emailSent === false ? "warning" : "success");
                    setMessage(response?.message ?? "We sent your sign-in link.");
                    setLocalPreview(response?.localPreview ?? null);
                  } catch (caught) {
                    setMessageTone("error");
                    setMessage(caught instanceof Error ? caught.message : "Could not send a sign-in link.");
                    setLocalPreview(null);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === "magic-link" ? "Sending..." : "Send sign-in link"}
              </OutlineButton>
            </PremiumCard>
          </div>
        ) : (
          <div className="space-y-6">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Account holder</div>
                  <h2 className="font-heading text-2xl text-charcoal">{session?.fullName || session?.email}</h2>
                  <p className="mt-2 text-sm text-charcoal/65">
                    Account #{session?.accountNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <OutlineButton
                    className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                    onClick={async () => {
                      await post("/api/guardian/logout", {});
                      await refresh();
                      navigate("/register");
                    }}
                  >
                    Sign out
                  </OutlineButton>
                </div>
              </div>
            </PremiumCard>

            {upcomingFees.length > 0 ? (
              <PremiumCard className="border border-moss/15 bg-moss/5 p-6">
                <div className="mb-4">
                  <div className="font-mono-label mb-2 text-[10px] uppercase tracking-[0.18em] text-moss">Upcoming payments</div>
                  <h3 className="font-heading text-xl text-charcoal">Scheduled card charges</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                    These are remaining balances from registrations where you chose to split payment.
                  </p>
                </div>
                <div className="space-y-3">
                  {upcomingFees.map((fee) => (
                    <div key={fee.orderId} className="rounded-2xl border border-charcoal/10 bg-white px-4 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium text-charcoal">
                            {formatMoneyFromCents(fee.amountCents, { currency: fee.currency })}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                            {fee.chargeDate ? `Charges on ${fee.chargeDate}` : "Charge date pending"} · Order #{fee.orderId}
                          </div>
                        </div>
                        <div className="text-sm text-charcoal/65">
                          {fee.programNames.length > 0 ? fee.programNames.join(", ") : "Registration balance"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PremiumCard>
            ) : null}

            {!accountComplete ? (
              <PremiumCard className="border border-charcoal/10 bg-white p-6">
                <div className="mb-4">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Required step</div>
                  <h3 className="font-heading text-xl text-charcoal">Complete the account before program selection opens</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-charcoal">
                    Full name <span className="text-clay">*</span>
                    <Input
                      className={`mt-2 ${fieldClass(completionErrors.fullName)}`}
                      value={completionForm.fullName}
                      onChange={(event) => {
                        setCompletionForm((prev) => ({ ...prev, fullName: event.target.value }));
                        setCompletionErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                    />
                    {completionErrors.fullName ? <div className="mt-1 text-xs text-clay">{completionErrors.fullName}</div> : null}
                  </label>
                  <label className="text-sm text-charcoal">
                    Phone number <span className="text-clay">*</span>
                    <Input
                      className={`mt-2 ${fieldClass(completionErrors.phone)}`}
                      value={completionForm.phone}
                      onChange={(event) => {
                        setCompletionForm((prev) => ({ ...prev, phone: event.target.value }));
                        setCompletionErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                    />
                    {completionErrors.phone ? <div className="mt-1 text-xs text-clay">{completionErrors.phone}</div> : null}
                  </label>
                  <label className="text-sm text-charcoal">
                    Emergency contact name <span className="text-clay">*</span>
                    <Input
                      className={`mt-2 ${fieldClass(completionErrors.emergencyContactName)}`}
                      value={completionForm.emergencyContactName}
                      onChange={(event) => {
                        setCompletionForm((prev) => ({ ...prev, emergencyContactName: event.target.value }));
                        setCompletionErrors((prev) => ({ ...prev, emergencyContactName: undefined }));
                      }}
                    />
                    {completionErrors.emergencyContactName ? <div className="mt-1 text-xs text-clay">{completionErrors.emergencyContactName}</div> : null}
                  </label>
                  <label className="text-sm text-charcoal">
                    Emergency contact phone <span className="text-clay">*</span>
                    <Input
                      className={`mt-2 ${fieldClass(completionErrors.emergencyContactPhone)}`}
                      value={completionForm.emergencyContactPhone}
                      onChange={(event) => {
                        setCompletionForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }));
                        setCompletionErrors((prev) => ({ ...prev, emergencyContactPhone: undefined }));
                      }}
                    />
                    {completionErrors.emergencyContactPhone ? <div className="mt-1 text-xs text-clay">{completionErrors.emergencyContactPhone}</div> : null}
                  </label>
                  <label className="text-sm text-charcoal md:col-span-2">
                    This account is for <span className="text-clay">*</span>
                    <Select
                      value={completionForm.accountRole}
                      onValueChange={(value) => {
                        setCompletionForm((prev) => ({ ...prev, accountRole: value as "parent_guardian" | "adult_student" }));
                        setCompletionErrors((prev) => ({ ...prev, accountRole: undefined }));
                      }}
                    >
                      <SelectTrigger className={`mt-2 ${fieldClass(completionErrors.accountRole)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent_guardian">Parent / guardian</SelectItem>
                        <SelectItem value="adult_student">Adult student</SelectItem>
                      </SelectContent>
                    </Select>
                    {completionErrors.accountRole ? <div className="mt-1 text-xs text-clay">{completionErrors.accountRole}</div> : null}
                  </label>
                </div>
                <div className="mt-6">
                  <ClayButton
                    className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                    disabled={busy === "complete-account"}
                    onClick={async () => {
                      if (!validateCompletion()) {
                        setMessageTone("error");
                        setMessage("Please finish every required account field before continuing.");
                        return;
                      }
                      setBusy("complete-account");
                      setMessage("");
                      try {
                        await patch("/api/guardian/me", completionForm);
                        setMessageTone("success");
                        setMessage("Account details saved.");
                        await refresh();
                      } catch (caught) {
                        setMessageTone("error");
                        setMessage(caught instanceof Error ? caught.message : "Could not save the account.");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === "complete-account" ? "Saving..." : "Save account details"}
                  </ClayButton>
                </div>
              </PremiumCard>
            ) : null}

            {accountComplete ? (
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <PremiumCard className="border border-charcoal/10 bg-white p-6">
                <div className="mb-4">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Participant profiles</div>
                  <h3 className="font-heading text-xl text-charcoal">Add myself or add a child</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                    Add every person who might register through this account. Adults do not need to add a child to continue.
                  </p>
                </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-charcoal">
                      Profile type <span className="text-clay">*</span>
                      <Select
                        value={participantForm.participantType}
                        onValueChange={(value) => {
                          setParticipantForm((prev) => ({ ...prev, participantType: value as "self" | "child" }));
                          setParticipantErrors((prev) => ({ ...prev, participantType: undefined }));
                        }}
                      >
                        <SelectTrigger className={`mt-2 ${fieldClass(participantErrors.participantType)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Add myself</SelectItem>
                          <SelectItem value="child">Add child</SelectItem>
                        </SelectContent>
                      </Select>
                      {participantErrors.participantType ? <div className="mt-1 text-xs text-clay">{participantErrors.participantType}</div> : null}
                    </label>
                    <label className="text-sm text-charcoal">
                      Full name <span className="text-clay">*</span>
                      <Input
                        className={`mt-2 ${fieldClass(participantErrors.fullName)}`}
                        value={participantForm.fullName}
                        onChange={(event) => {
                          setParticipantForm((prev) => ({ ...prev, fullName: event.target.value }));
                          setParticipantErrors((prev) => ({ ...prev, fullName: undefined }));
                        }}
                      />
                      {participantErrors.fullName ? <div className="mt-1 text-xs text-clay">{participantErrors.fullName}</div> : null}
                    </label>
                    <label className="text-sm text-charcoal">
                      Date of birth <span className="text-clay">*</span>
                      <Input
                        className={`mt-2 ${fieldClass(participantErrors.dateOfBirth)}`}
                        type="date"
                        value={participantForm.dateOfBirth}
                        onChange={(event) => {
                          setParticipantForm((prev) => ({ ...prev, dateOfBirth: event.target.value }));
                          setParticipantErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                        }}
                      />
                      {participantErrors.dateOfBirth ? <div className="mt-1 text-xs text-clay">{participantErrors.dateOfBirth}</div> : null}
                    </label>
                    <label className="text-sm text-charcoal">
                      Gender <span className="text-clay">*</span>
                      <Select
                        value={participantForm.gender}
                        onValueChange={(value) => {
                          setParticipantForm((prev) => ({ ...prev, gender: value }));
                          setParticipantErrors((prev) => ({ ...prev, gender: undefined }));
                        }}
                      >
                        <SelectTrigger className={`mt-2 ${fieldClass(participantErrors.gender)}`}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                      {participantErrors.gender ? <div className="mt-1 text-xs text-clay">{participantErrors.gender}</div> : null}
                    </label>
                    <label className="text-sm text-charcoal md:col-span-2">
                      Medical notes (optional)
                      <Textarea className="mt-2 min-h-[120px] bg-cream/50 border-charcoal/10" value={participantForm.medicalNotes} onChange={(event) => setParticipantForm((prev) => ({ ...prev, medicalNotes: event.target.value }))} />
                    </label>
                  </div>
                  <div className="mt-6">
                    <ClayButton
                      className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                      disabled={busy === "add-participant"}
                      onClick={async () => {
                        if (!validateParticipant()) {
                          setMessageTone("error");
                          setMessage("Please complete every required participant field before saving.");
                          return;
                        }
                        setBusy("add-participant");
                        setMessage("");
                        try {
                          await post("/api/guardian/students", participantForm);
                          setMessageTone("success");
                          setMessage("Participant profile saved.");
                          setParticipantForm({
                            participantType: session?.accountRole === "adult_student" ? "self" : "child",
                            fullName: "",
                            dateOfBirth: "",
                            gender: "",
                            medicalNotes: "",
                          });
                          setParticipantErrors({});
                          await refresh();
                        } catch (caught) {
                          setMessageTone("error");
                          setMessage(caught instanceof Error ? caught.message : "Could not save the participant.");
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      {busy === "add-participant" ? "Saving..." : "Save participant profile"}
                    </ClayButton>
                  </div>
                </PremiumCard>

                <div className="space-y-6">
                  <PremiumCard className="border border-charcoal/10 bg-moss/5 p-6">
                  <div className="mb-4">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Profiles on this account</div>
                    <h3 className="font-heading text-xl text-charcoal">Profiles on this account</h3>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                      These are the people you can register. Add another profile any time.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div key={participant.id} className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-charcoal">{participant.full_name}</div>
                            <div className="text-xs uppercase tracking-[0.16em] text-charcoal/55">
                              {participant.participant_type === "self" ? "Self" : "Child"} · {ageLabel(participant)} · {participant.gender ?? "Gender needed"}
                            </div>
                          </div>
                          <OutlineButton
                            className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                            onClick={async () => {
                              setBusy(`delete-${participant.id}`);
                              try {
                                await destroy(`/api/guardian/students/${participant.id}`);
                                await refresh();
                              } finally {
                                setBusy(null);
                              }
                            }}
                          >
                            {busy === `delete-${participant.id}` ? "Removing..." : "Remove"}
                          </OutlineButton>
                        </div>
                        {participant.medical_notes ? (
                          <div className="mt-3 text-sm text-charcoal/65">{participant.medical_notes}</div>
                        ) : null}
                      </div>
                    ))}
                    {participants.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-charcoal/15 bg-cream/40 p-4 text-sm text-charcoal/65">
                        Add at least one participant profile before live program registration opens.
                      </div>
                    ) : null}
                  </div>
                  </PremiumCard>

                  <PremiumCard className="border border-charcoal/10 bg-clay/5 p-6">
                  <div className="mb-4">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-clay mb-2">Available programs</div>
                    <h3 className="font-heading text-xl text-charcoal">Choose what to register for</h3>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                      BJJ shows tracks that match age and gender. Archery is open to any saved participant.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      disabled={participants.length === 0}
                      onClick={() => navigate("/programs/bjj/register")}
                      className="group flex items-center justify-between rounded-2xl border border-moss/15 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-moss/40 hover:bg-moss/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-charcoal">Brazilian Jiu-Jitsu</div>
                        <div className="mt-1 text-xs text-charcoal/50">Mississauga + Oakville</div>
                      </div>
                      <span className="rounded-full border border-moss/20 bg-moss/8 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.16em] text-moss">
                        Register
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={participants.length === 0}
                      onClick={() => navigate("/programs/archery/register")}
                      className="group flex items-center justify-between rounded-2xl border border-clay/20 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-clay/40 hover:bg-clay/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-charcoal">Traditional Archery</div>
                        <div className="mt-1 text-xs text-charcoal/50">Open registration</div>
                      </div>
                      <span className="rounded-full border border-clay/20 bg-clay/8 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.16em] text-clay">
                        Register
                      </span>
                    </button>
                    <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                      <Link href="/trial">Start BJJ Free Trial</Link>
                    </OutlineButton>
                  </div>
                  </PremiumCard>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </MotionPage>
  );
}
