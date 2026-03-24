import React from "react";
import { Link, useLocation } from "wouter";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { PROGRAMS, getProgramTypeLabel } from "@/lib/programConfig";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { MotionDiv, MotionPage } from "@/components/motion/PageMotion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

function studentAgeLabel(student: SavedStudent) {
  if (!student.date_of_birth) return "Date of birth not saved yet";
  const dob = Date.parse(student.date_of_birth);
  if (!Number.isFinite(dob)) return student.date_of_birth;
  const age = Math.floor((Date.now() - dob) / 31557600000);
  return `${student.date_of_birth} · age ${Math.max(0, age)}`;
}

const RegistrationHub = () => {
  const [, navigate] = useLocation();
  const programs = Object.values(PROGRAMS);
  const targetPath = nextPath();
  const sessionQuery = useGuardianSession();
  const studentsQuery = useGuardianStudents(Boolean(sessionQuery.data?.authenticated));
  const [loginAccountNumber, setLoginAccountNumber] = React.useState("");
  const [loginEmail, setLoginEmail] = React.useState("");
  const [signupFullName, setSignupFullName] = React.useState("");
  const [signupPhone, setSignupPhone] = React.useState("");
  const [signupEmail, setSignupEmail] = React.useState("");
  const [newStudentName, setNewStudentName] = React.useState("");
  const [newStudentDob, setNewStudentDob] = React.useState("");
  const [newStudentGender, setNewStudentGender] = React.useState("");
  const [newStudentNotes, setNewStudentNotes] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState(errorMessage());

  async function refreshGuardianData() {
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
    const json = (await res.json().catch(() => null)) as any;
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
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) throw new Error(json?.error ?? "Request failed");
    return json;
  }

  async function destroy(path: string) {
    const res = await fetch(path, {
      method: "DELETE",
      credentials: "include",
    });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) throw new Error(json?.error ?? "Request failed");
    return json;
  }

  const session = sessionQuery.data;
  const authenticated = Boolean(session?.authenticated);
  const savedStudents = studentsQuery.data?.students ?? [];

  return (
    <MotionPage className="bg-cream min-h-screen pb-24">
      <div className="noise-overlay" />
      <main className="max-w-6xl mx-auto px-6 pt-28">
        <SectionHeader eyebrow="Registration" title={authenticated ? "Your Registration Hub" : "Sign In To Register"} className="mb-8" />
        <p className="font-body text-pretty text-sm text-charcoal/70 max-w-2xl mb-6">
          {authenticated
            ? "BJJ enrollment is live. Start from your guardian account so saved students, payment plans, and follow-up actions stay attached to the right household."
            : "BJJ enrollment is now account-based. Sign in with your account number or email link, or create your guardian account before starting registration."}
        </p>
        {message ? (
          <div className="mb-8 rounded-2xl border border-clay/20 bg-clay/5 px-4 py-3 text-sm text-clay">
            {message}
          </div>
        ) : null}

        {!authenticated ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PremiumCard className="bg-white border border-charcoal/10 space-y-4">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Sign in</div>
                <h2 className="font-heading text-2xl text-charcoal">Use your account number or email</h2>
              </div>

              <div className="space-y-3">
                <label className="font-body text-sm text-charcoal font-medium">Account number</label>
                <Input
                  value={loginAccountNumber}
                  onChange={(e) => setLoginAccountNumber(e.target.value)}
                  placeholder="10–12 digits"
                  inputMode="numeric"
                />
                <ClayButton
                  className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                  disabled={busy === "account-login"}
                  onClick={async () => {
                    setBusy("account-login");
                    setMessage("");
                    try {
                      await post("/api/guardian/login-account", { accountNumber: loginAccountNumber });
                      await refreshGuardianData();
                      navigate(targetPath);
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : "Could not sign in.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {busy === "account-login" ? "Signing in..." : "Sign in with account number"}
                </ClayButton>
              </div>

              <div className="space-y-3 border-t border-charcoal/10 pt-4">
                <label className="font-body text-sm text-charcoal font-medium">Email me a sign-in link</label>
                <Input
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@email.com"
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
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : "Could not send sign-in link.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {busy === "magic-link" ? "Sending..." : "Send sign-in link"}
                </OutlineButton>
              </div>
            </PremiumCard>

            <PremiumCard className="bg-white border border-charcoal/10 space-y-4">
              <div>
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Create account</div>
                <h2 className="font-heading text-2xl text-charcoal">Create your guardian account</h2>
              </div>
              <div className="space-y-3">
                <Input value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} placeholder="Full name" />
                <Input value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder="Phone number" type="tel" />
                <Input value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="Email" type="email" />
                <ClayButton
                  className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                  disabled={busy === "signup"}
                  onClick={async () => {
                    setBusy("signup");
                    setMessage("");
                    try {
                      const json = await post("/api/guardian/signup", {
                        fullName: signupFullName,
                        phone: signupPhone,
                        email: signupEmail,
                        next: targetPath,
                      });
                      setMessage(
                        json?.accountNumber
                          ? `Account created. Your account number is ${json.accountNumber}. Check your email for the sign-in link.`
                          : "Account created. Check your email for the sign-in link.",
                      );
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : "Could not create account.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {busy === "signup" ? "Creating..." : "Create guardian account"}
                </ClayButton>
              </div>
            </PremiumCard>
          </div>
        ) : (
          <div className="space-y-8">
            <PremiumCard className="bg-white border border-charcoal/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Guardian account</div>
                  <h2 className="font-heading text-2xl text-charcoal">{session?.fullName || session?.email}</h2>
                  <p className="mt-2 text-sm text-charcoal/65">
                    Account #{session?.accountNumber} · {session?.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <ClayButton
                    className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                    onClick={() => navigate(targetPath)}
                  >
                    Continue to BJJ
                  </ClayButton>
                  <OutlineButton
                    className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                    onClick={async () => {
                      setBusy("logout");
                      try {
                        await post("/api/guardian/logout", {});
                        await refreshGuardianData();
                        navigate("/register");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === "logout" ? "Signing out..." : "Sign out"}
                  </OutlineButton>
                </div>
              </div>
            </PremiumCard>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
              <PremiumCard className="bg-white border border-charcoal/10 space-y-4">
                <div>
                  <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">Saved students</div>
                  <h3 className="font-heading text-xl text-charcoal">Build your household once</h3>
                </div>

                <div className="space-y-3">
                  {savedStudents.map((student) => (
                    <div key={student.id} className="rounded-2xl border border-charcoal/10 bg-cream/35 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-body font-medium text-charcoal">{student.full_name}</div>
                          <div className="mt-1 text-xs text-charcoal/60">{studentAgeLabel(student)}</div>
                          {student.medical_notes ? (
                            <div className="mt-2 text-xs text-charcoal/55">{student.medical_notes}</div>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <OutlineButton
                            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]"
                            onClick={async () => {
                              setBusy(`edit-student-${student.id}`);
                              setMessage("");
                              try {
                                await patch(`/api/guardian/students/${student.id}`, {
                                  fullName: student.full_name,
                                  dateOfBirth: student.date_of_birth ?? "",
                                  gender: student.gender ?? "",
                                  medicalNotes: student.medical_notes ?? "",
                                });
                                await refreshGuardianData();
                                setMessage("Saved student synced.");
                              } catch (error) {
                                setMessage(error instanceof Error ? error.message : "Could not update student.");
                              } finally {
                                setBusy(null);
                              }
                            }}
                          >
                            Refresh
                          </OutlineButton>
                          <OutlineButton
                            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]"
                            onClick={async () => {
                              setBusy(`delete-student-${student.id}`);
                              setMessage("");
                              try {
                                await destroy(`/api/guardian/students/${student.id}`);
                                await refreshGuardianData();
                              } catch (error) {
                                setMessage(error instanceof Error ? error.message : "Could not remove student.");
                              } finally {
                                setBusy(null);
                              }
                            }}
                          >
                            Remove
                          </OutlineButton>
                        </div>
                      </div>
                    </div>
                  ))}
                  {savedStudents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-charcoal/15 bg-cream/25 px-4 py-5 text-sm text-charcoal/60">
                      No saved students yet. Add one now or create them inside the BJJ registration flow.
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-charcoal/10 pt-4 space-y-3">
                  <div className="font-body text-sm text-charcoal font-medium">Add a saved student</div>
                  <Input value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Student full name" />
                  <Input value={newStudentDob} onChange={(e) => setNewStudentDob(e.target.value)} type="date" />
                  <Input value={newStudentGender} onChange={(e) => setNewStudentGender(e.target.value)} placeholder="Gender (optional)" />
                  <Textarea value={newStudentNotes} onChange={(e) => setNewStudentNotes(e.target.value)} placeholder="Medical notes or accessibility needs (optional)" rows={3} />
                  <ClayButton
                    className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]"
                    disabled={busy === "add-student"}
                    onClick={async () => {
                      setBusy("add-student");
                      setMessage("");
                      try {
                        await post("/api/guardian/students", {
                          fullName: newStudentName,
                          dateOfBirth: newStudentDob,
                          gender: newStudentGender,
                          medicalNotes: newStudentNotes,
                        });
                        setNewStudentName("");
                        setNewStudentDob("");
                        setNewStudentGender("");
                        setNewStudentNotes("");
                        await refreshGuardianData();
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Could not save student.");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === "add-student" ? "Saving..." : "Save student"}
                  </ClayButton>
                </div>
              </PremiumCard>

              <div className="grid grid-cols-1 gap-6">
                {programs.map((program, index) => (
                  <MotionDiv key={program.slug} delay={index * 0.04}>
                    <PremiumCard className="bg-white border border-charcoal/10 flex flex-col justify-between h-full">
                      <div>
                        <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-2">
                          {getProgramTypeLabel(program.type)}
                        </div>
                        <h2 className="font-heading text-2xl text-charcoal">{program.name}</h2>
                        <p className="mt-2 font-body text-xs text-charcoal/60 uppercase tracking-[0.16em]">
                          {program.ageRangeLabel}
                        </p>
                        <p className="mt-4 font-body text-sm text-charcoal/70 leading-relaxed text-pretty">
                          {program.shortPitch}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal/50">
                          Registration Flow
                        </div>
                        {program.enrollmentStatus === "open" ? (
                          <ClayButton asChild className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                            <Link href={program.registerPath}>
                              Register for {program.slug === "bjj" ? "BJJ" : program.name}
                            </Link>
                          </ClayButton>
                        ) : (
                          <OutlineButton asChild className="px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                            <Link href={`/contact?interest=${program.slug}`}>Join waitlist</Link>
                          </OutlineButton>
                        )}
                      </div>
                    </PremiumCard>
                  </MotionDiv>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </MotionPage>
  );
};

export default RegistrationHub;
