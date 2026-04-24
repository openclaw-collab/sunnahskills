import React from "react";
import { Link, useLocation } from "wouter";
import { MotionPage } from "@/components/motion/PageMotion";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGuardianSession, useGuardianStudents } from "@/hooks/useGuardianSession";
import { useProgramsCatalog } from "@/hooks/useProgramsCatalog";
import {
  addLineToFamilyCart,
  loadFamilyCart,
  removeCartLine,
  type AccountCartSnapshot,
} from "@/lib/familyCart";
import { formatMoneyFromCents } from "@shared/money";
import {
  ARCHERY_EYE_DOMINANCE_VIDEO_URL,
  ARCHERY_FIRST_REGISTRATION_PRICE_CENTS,
  ARCHERY_SERIES_LABEL,
  ARCHERY_ADDITIONAL_REGISTRATION_PRICE_CENTS,
  archeryEyeDominanceOptions,
  getArcheryFamilyPriceCents,
  type ArcheryEyeDominance,
} from "../../../../shared/archeryCatalog";

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "Time listed in confirmation";
  return `${start ?? ""}${start && end ? "–" : ""}${end ?? ""}`;
}

export default function ArcheryRegistration() {
  const [, navigate] = useLocation();
  const sessionQuery = useGuardianSession();
  const participantsQuery = useGuardianStudents(Boolean(sessionQuery.data?.authenticated));
  const programsQuery = useProgramsCatalog();
  const [selectedParticipantId, setSelectedParticipantId] = React.useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null);
  const [eyeDominance, setEyeDominance] = React.useState<ArcheryEyeDominance | "">("");
  const [dominantHand, setDominantHand] = React.useState("");
  const [experience, setExperience] = React.useState("beginner");
  const [notes, setNotes] = React.useState("");
  const [cart, setCart] = React.useState(() => loadFamilyCart());
  const [error, setError] = React.useState<string | null>(null);

  const session = sessionQuery.data;
  const participants = participantsQuery.data?.students ?? [];
  const archery = programsQuery.data?.programs.find((item) => item.slug === "archery");
  const sessions = (archery?.sessions ?? []).filter((item: any) => Number(item.visible ?? 1) === 1);
  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId) ?? null;
  const selectedSession = sessions.find((item: any) => Number(item.id) === Number(selectedSessionId)) ?? sessions[0] ?? null;
  const priceId = archery?.prices?.[0]?.id ?? null;
  const cartLines = cart?.lines ?? [];
  const archeryLineCount = cartLines.filter((line) => line.programSlug === "archery").length;
  const nextArcheryPriceCents = getArcheryFamilyPriceCents(archeryLineCount);

  function archeryLinePriceCents(lineId: string) {
    const archeryLines = cartLines.filter((line) => line.programSlug === "archery");
    const archeryIndex = archeryLines.findIndex((line) => line.id === lineId);
    return getArcheryFamilyPriceCents(archeryIndex);
  }

  React.useEffect(() => {
    if (!selectedParticipantId && participants[0]?.id) setSelectedParticipantId(participants[0].id);
  }, [participants, selectedParticipantId]);

  React.useEffect(() => {
    if (!selectedSessionId && sessions[0]?.id) setSelectedSessionId(Number(sessions[0].id));
  }, [selectedSessionId, sessions]);

  if (sessionQuery.isLoading || participantsQuery.isLoading || programsQuery.isLoading) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-5xl px-6 pt-28">
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <p className="text-sm text-charcoal/70">Loading your account and archery registration...</p>
          </PremiumCard>
        </main>
      </MotionPage>
    );
  }

  if (!session?.authenticated) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <SectionHeader eyebrow="Archery Registration" title="Sign in before you register" className="mb-6" />
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <p className="text-sm leading-relaxed text-charcoal/70">
              Sign in so your participants, waiver, and payment stay in one place.
            </p>
            <div className="mt-6">
              <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register?next=%2Fprograms%2Farchery%2Fregister">Sign in to register</Link>
              </ClayButton>
            </div>
          </PremiumCard>
        </main>
      </MotionPage>
    );
  }

  if (!session.accountComplete || participants.length === 0) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <SectionHeader eyebrow="Archery Registration" title="Finish your account setup first" className="mb-6" />
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <p className="text-sm leading-relaxed text-charcoal/70">
              Save your account details and add at least one participant before registering for archery.
            </p>
            <div className="mt-6">
              <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register">Finish account setup</Link>
              </ClayButton>
            </div>
          </PremiumCard>
        </main>
      </MotionPage>
    );
  }

  const accountSnapshot: AccountCartSnapshot = {
    fullName: session.fullName ?? "",
    email: session.email ?? "",
    phone: session.phone ?? "",
    emergencyContactName: session.emergencyContactName ?? "",
    emergencyContactPhone: session.emergencyContactPhone ?? "",
    accountRole: (session.accountRole as "parent_guardian" | "adult_student") ?? "parent_guardian",
  };

  function addArcheryLine() {
    setError(null);
    if (!selectedParticipant) {
      setError("Choose who you are registering for archery.");
      return;
    }
    if (!selectedSession?.id) {
      setError("Choose an archery time slot.");
      return;
    }
    if (!eyeDominance) {
      setError("Watch the eye-dominance video and choose an option before continuing.");
      return;
    }

    const existing = loadFamilyCart();
    const email = accountSnapshot.email.trim().toLowerCase();
    if (existing && existing.account.email.trim().toLowerCase() !== email) {
      setError("Your cart was started with a different account email. Finish or clear that cart first.");
      return;
    }

    const duplicate = (existing?.lines ?? []).some((line) =>
      line.programSlug === "archery" &&
      line.participant.fullName.trim().toLowerCase() === selectedParticipant.full_name.trim().toLowerCase() &&
      line.participant.dateOfBirth === (selectedParticipant.date_of_birth ?? "") &&
      Number(line.programDetails.sessionId) === Number(selectedSession.id),
    );
    if (duplicate) {
      setError("That participant is already in the cart for this archery time slot.");
      return;
    }

    const nextCart = addLineToFamilyCart(accountSnapshot, {
      programSlug: "archery",
      participant: {
        id: selectedParticipant.id,
        participantType: selectedParticipant.participant_type,
        fullName: selectedParticipant.full_name,
        dateOfBirth: selectedParticipant.date_of_birth ?? "",
        gender: selectedParticipant.gender ?? "",
        medicalNotes: selectedParticipant.medical_notes ?? "",
        experienceLevel: experience,
      },
      paymentChoice: "full",
      programDetails: {
        sessionId: Number(selectedSession.id),
        priceId,
        programSpecific: {
          eyeDominance,
          dominantHand,
          experience,
          notes,
        },
      },
    });
    setCart(nextCart);
    setError(null);
    setNotes("");
  }

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-7xl px-6 pt-28">
        <SectionHeader eyebrow="Archery Registration" title="Register for Archery" className="mb-6" />
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-charcoal/70">
          Choose a participant, answer the archery details, then continue to waiver and payment.
        </p>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label mb-3 text-[10px] uppercase tracking-[0.18em] text-moss">Participants</div>
            <div className="space-y-3">
              {participants.map((participant) => {
                const active = participant.id === selectedParticipantId;
                return (
                  <button
                    key={participant.id}
                    type="button"
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      active ? "border-moss bg-moss/5" : "border-charcoal/10 bg-cream/40 hover:bg-cream/70"
                    }`}
                    onClick={() => setSelectedParticipantId(participant.id)}
                  >
                    <div className="text-sm font-medium text-charcoal">{participant.full_name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                      {participant.participant_type === "self" ? "Self" : "Child"} · {participant.gender ?? "Gender not set"}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <OutlineButton asChild className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register">Manage profiles</Link>
              </OutlineButton>
            </div>
          </PremiumCard>

          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label mb-3 text-[10px] uppercase tracking-[0.18em] text-moss">Archery details</div>
            <div className="space-y-5">
              <label className="block text-sm text-charcoal">
                Time slot
                <Select value={selectedSession ? String(selectedSession.id) : ""} onValueChange={(value) => setSelectedSessionId(Number(value))}>
                  <SelectTrigger className="mt-2 border-charcoal/10 bg-cream/50">
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((sessionOption: any) => (
                      <SelectItem key={sessionOption.id} value={String(sessionOption.id)}>
                        {sessionOption.name ?? "Archery session"} · {formatTimeRange(sessionOption.start_time, sessionOption.end_time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="rounded-2xl border border-moss/15 bg-moss/5 p-4">
                <div className="text-sm font-medium text-charcoal">Eye dominance</div>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/65">
                  Watch the short video, then choose the option that matches your result.
                </p>
                <a
                  href={ARCHERY_EYE_DOMINANCE_VIDEO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-moss underline underline-offset-4"
                >
                  Watch the eye-dominance video
                </a>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {archeryEyeDominanceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                        eyeDominance === option.value ? "border-moss bg-white text-charcoal" : "border-charcoal/10 bg-cream/40 text-charcoal/70"
                      }`}
                      onClick={() => setEyeDominance(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm text-charcoal">
                Dominant hand
                <Select value={dominantHand} onValueChange={setDominantHand}>
                  <SelectTrigger className="mt-2 border-charcoal/10 bg-cream/50">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Right-handed</SelectItem>
                    <SelectItem value="left">Left-handed</SelectItem>
                    <SelectItem value="ambidextrous">Ambidextrous</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="block text-sm text-charcoal">
                Prior archery experience
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="mt-2 border-charcoal/10 bg-cream/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Complete beginner</SelectItem>
                    <SelectItem value="some">A few sessions</SelectItem>
                    <SelectItem value="practiced">Practiced before</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="block text-sm text-charcoal">
                Anything else we should know? (optional)
                <Textarea
                  className="mt-2"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Equipment questions, goals, or accessibility needs"
                />
              </label>
            </div>
          </PremiumCard>

          <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label mb-3 text-[10px] uppercase tracking-[0.18em] text-moss">Summary</div>
            <div className="space-y-4 text-sm text-charcoal/70">
              <div>
                <div className="text-lg font-heading text-charcoal">Traditional Archery</div>
                <div className="mt-1">{ARCHERY_SERIES_LABEL}</div>
              </div>
              <div className="rounded-2xl border border-charcoal/10 bg-cream/50 p-4">
                <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-charcoal/55">Price</div>
                <div className="mt-1 text-2xl font-heading text-charcoal">{formatMoneyFromCents(nextArcheryPriceCents)}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                  First family registration {formatMoneyFromCents(ARCHERY_FIRST_REGISTRATION_PRICE_CENTS)} · additional family registrations {formatMoneyFromCents(ARCHERY_ADDITIONAL_REGISTRATION_PRICE_CENTS)}
                </div>
              </div>
              {selectedSession ? (
                <div>
                  <div className="font-medium text-charcoal">{selectedSession.name ?? "Selected time slot"}</div>
                  <div>{formatTimeRange(selectedSession.start_time, selectedSession.end_time)}</div>
                </div>
              ) : null}
              {error ? <div className="rounded-xl border border-clay/20 bg-clay/5 p-3 text-clay">{error}</div> : null}
              <ClayButton className="w-full px-6 py-3 text-[11px] uppercase tracking-[0.18em]" onClick={addArcheryLine}>
                Add to cart
              </ClayButton>
            </div>

            <div className="mt-6 border-t border-charcoal/10 pt-5">
              <div className="font-mono-label mb-3 text-[10px] uppercase tracking-[0.18em] text-moss">Your registrations</div>
              <div className="space-y-3">
                {cartLines.length > 0 ? (
                  cartLines.map((line) => (
                    <div key={line.id} className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-charcoal">{line.participant.fullName}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                            {line.programSlug === "archery"
                              ? "Traditional Archery"
                              : "Brazilian Jiu-Jitsu"}
                          </div>
                          {line.programSlug === "archery" ? (
                            <div className="mt-2 text-sm text-charcoal/65">
                              Eye dominance: {line.programDetails.programSpecific.eyeDominance} · {formatMoneyFromCents(archeryLinePriceCents(line.id))}
                            </div>
                          ) : null}
                        </div>
                        <OutlineButton
                          className="px-3 py-2 text-[10px] uppercase tracking-[0.18em]"
                          onClick={() => {
                            removeCartLine(line.id);
                            setCart(loadFamilyCart());
                          }}
                        >
                          Remove
                        </OutlineButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-charcoal/15 bg-cream/40 p-4 text-sm text-charcoal/65">
                    No registrations added yet.
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <ClayButton
                  className="w-full px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                  disabled={cartLines.length === 0}
                  onClick={() => navigate("/registration/cart")}
                >
                  Continue to waiver and payment
                </ClayButton>
                <OutlineButton asChild className="w-full px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/registration/cart">Review checkout</Link>
                </OutlineButton>
              </div>
            </div>
          </PremiumCard>
        </div>
      </main>
    </MotionPage>
  );
}
