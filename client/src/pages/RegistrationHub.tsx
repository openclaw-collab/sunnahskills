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

function nextPath() {
  if (typeof window === "undefined") return "/programs/bjj/register";
  const raw = new URLSearchParams(window.location.search).get("next") ?? "/programs/bjj/register";
  return raw.startsWith("/") ? raw : "/programs/bjj/register";
}

function errorMessage() {
  if (typeof window === "undefined") return "";
  const raw = new URLSearchParams(window.location.search).get("error") ?? "";
  if (raw === "invalid_link") return "The sign-in link was invalid.";
  if (raw === "link_used_or_expired") return "That sign-in link was already used or has expired.";
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
  const sessionQuery = useGuardianSession();
  const participantsQuery = useGuardianStudents(Boolean(sessionQuery.data?.authenticated));

  const [signupFullName, setSignupFullName] = React.useState("");
  const [signupEmail, setSignupEmail] = React.useState("");
  const [loginEmail, setLoginEmail] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState(errorMessage());

  const [completionForm, setCompletionForm] = React.useState({
    fullName: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    accountRole: "parent_guardian" as "parent_guardian" | "adult_student",
  });

  const [participantForm, setParticipantForm] = React.useState({
    participantType: "child" as "self" | "child",
    fullName: "",
    dateOfBirth: "",
    gender: "",
    medicalNotes: "",
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["/api/guardian/me"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/guardian/students"] });
  }

  async function post(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!res.ok) throw new Error(json?.error ?? "Request failed");
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

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-6xl px-6 pt-28">
        <SectionHeader
          eyebrow="Family & Member Account"
          title={authenticated ? "Account & participant profiles" : "Open your account before you register"}
          className="mb-8"
        />
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-charcoal/70">
          Adults and families use the same account system here. We start with a secure sign-in link, complete the
          required contact details, add one or more participant profiles, and only then open live BJJ registration.
        </p>

        {message ? (
          <div className="mb-8 rounded-2xl border border-clay/20 bg-clay/5 px-4 py-3 text-sm text-clay">
            {message}
          </div>
        ) : null}

        {!authenticated ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <PremiumCard className="space-y-4 border border-charcoal/10 bg-white p-6">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Create account</div>
                <h2 className="font-heading text-2xl text-charcoal">Start your Family &amp; Member Account</h2>
              </div>
              <Input
                value={signupFullName}
                onChange={(event) => setSignupFullName(event.target.value)}
                placeholder="Full name"
              />
              <Input
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                placeholder="Email"
                type="email"
              />
              <ClayButton
                className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                disabled={busy === "signup"}
                onClick={async () => {
                  setBusy("signup");
                  setMessage("");
                  try {
                    const json = await post("/api/guardian/signup", {
                      fullName: signupFullName,
                      email: signupEmail,
                      next: targetPath,
                    });
                    setMessage(json?.message ?? "Check your email for the sign-in link.");
                  } catch (caught) {
                    setMessage(caught instanceof Error ? caught.message : "Could not create the account.");
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
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="Email"
                type="email"
              />
              <OutlineButton
                className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                disabled={busy === "magic-link"}
                onClick={async () => {
                  setBusy("magic-link");
                  setMessage("");
                  try {
                    await post("/api/guardian/request-link", { email: loginEmail, next: targetPath });
                    setMessage("If we found your account, we sent a sign-in link.");
                  } catch (caught) {
                    setMessage(caught instanceof Error ? caught.message : "Could not send a sign-in link.");
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
                  {accountComplete && participants.length > 0 ? (
                    <ClayButton className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]" onClick={() => navigate(targetPath)}>
                      Continue to BJJ
                    </ClayButton>
                  ) : null}
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

            {!accountComplete ? (
              <PremiumCard className="border border-charcoal/10 bg-white p-6">
                <div className="mb-4">
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Required step</div>
                  <h3 className="font-heading text-xl text-charcoal">Complete the account before program selection opens</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-charcoal">
                    Full name
                    <Input className="mt-2 bg-cream/50 border-charcoal/10" value={completionForm.fullName} onChange={(event) => setCompletionForm((prev) => ({ ...prev, fullName: event.target.value }))} />
                  </label>
                  <label className="text-sm text-charcoal">
                    Phone number
                    <Input className="mt-2 bg-cream/50 border-charcoal/10" value={completionForm.phone} onChange={(event) => setCompletionForm((prev) => ({ ...prev, phone: event.target.value }))} />
                  </label>
                  <label className="text-sm text-charcoal">
                    Emergency contact name
                    <Input className="mt-2 bg-cream/50 border-charcoal/10" value={completionForm.emergencyContactName} onChange={(event) => setCompletionForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))} />
                  </label>
                  <label className="text-sm text-charcoal">
                    Emergency contact phone
                    <Input className="mt-2 bg-cream/50 border-charcoal/10" value={completionForm.emergencyContactPhone} onChange={(event) => setCompletionForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))} />
                  </label>
                  <label className="text-sm text-charcoal md:col-span-2">
                    This account is for
                    <Select value={completionForm.accountRole} onValueChange={(value) => setCompletionForm((prev) => ({ ...prev, accountRole: value as "parent_guardian" | "adult_student" }))}>
                      <SelectTrigger className="mt-2 bg-cream/50 border-charcoal/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent_guardian">Parent / guardian</SelectItem>
                        <SelectItem value="adult_student">Adult student</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                </div>
                <div className="mt-6">
                  <ClayButton
                    className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                    disabled={busy === "complete-account"}
                    onClick={async () => {
                      setBusy("complete-account");
                      setMessage("");
                      try {
                        await patch("/api/guardian/me", completionForm);
                        await refresh();
                      } catch (caught) {
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
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
                      Profile type
                      <Select value={participantForm.participantType} onValueChange={(value) => setParticipantForm((prev) => ({ ...prev, participantType: value as "self" | "child" }))}>
                        <SelectTrigger className="mt-2 bg-cream/50 border-charcoal/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Add myself</SelectItem>
                          <SelectItem value="child">Add child</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="text-sm text-charcoal">
                      Full name
                      <Input className="mt-2 bg-cream/50 border-charcoal/10" value={participantForm.fullName} onChange={(event) => setParticipantForm((prev) => ({ ...prev, fullName: event.target.value }))} />
                    </label>
                    <label className="text-sm text-charcoal">
                      Date of birth
                      <Input className="mt-2 bg-cream/50 border-charcoal/10" type="date" value={participantForm.dateOfBirth} onChange={(event) => setParticipantForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} />
                    </label>
                    <label className="text-sm text-charcoal">
                      Gender
                      <Select value={participantForm.gender} onValueChange={(value) => setParticipantForm((prev) => ({ ...prev, gender: value }))}>
                        <SelectTrigger className="mt-2 bg-cream/50 border-charcoal/10">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                        </SelectContent>
                      </Select>
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
                        setBusy("add-participant");
                        setMessage("");
                        try {
                          await post("/api/guardian/students", participantForm);
                          setParticipantForm({
                            participantType: session?.accountRole === "adult_student" ? "self" : "child",
                            fullName: "",
                            dateOfBirth: "",
                            gender: "",
                            medicalNotes: "",
                          });
                          await refresh();
                        } catch (caught) {
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

                <PremiumCard className="border border-charcoal/10 bg-white p-6">
                  <div className="mb-4">
                    <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Ready for registration</div>
                    <h3 className="font-heading text-xl text-charcoal">Profiles on this account</h3>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                      Once each profile is saved, BJJ registration will only show the tracks that fit that participant&apos;s age and gender.
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
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ClayButton
                      className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                      disabled={participants.length === 0}
                      onClick={() => navigate(targetPath)}
                    >
                      Register for BJJ
                    </ClayButton>
                    <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                      <Link href="/trial">Start with a free trial</Link>
                    </OutlineButton>
                  </div>
                </PremiumCard>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </MotionPage>
  );
}
