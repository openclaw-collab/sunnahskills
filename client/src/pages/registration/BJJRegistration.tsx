import React from "react";
import { Link, useLocation } from "wouter";
import { MotionPage } from "@/components/motion/PageMotion";
import { SectionHeader } from "@/components/brand/SectionHeader";
import { PremiumCard } from "@/components/brand/PremiumCard";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGuardianSession, useGuardianStudents } from "@/hooks/useGuardianSession";
import { useProgramsCatalog } from "@/hooks/useProgramsCatalog";
import { addLineToFamilyCart, loadFamilyCart, removeCartLine, type AccountCartSnapshot } from "@/lib/familyCart";
import {
  BJJ_MARKETING_GROUPS,
  BJJ_TRACK_BY_KEY,
  isEligibleForBjjTrack,
  isWomenSelfDefenseBjjTrack,
  isWomenWeeklyBjjTrack,
  type BjjMarketingGroup,
} from "../../../../shared/bjjCatalog";
import { computeLaterPaymentDateIso, computeLineTuitionCents, splitPaymentPlan } from "../../../../shared/orderPricing";
import { formatMoneyFromCents } from "@shared/money";
import { StudioBlock } from "@/studio/StudioBlock";
import { StudioText } from "@/studio/StudioText";

const DEFAULT_BJJ_LOCATION_ID = "mississauga";

function computeAge(dateOfBirth: string | null | undefined) {
  if (!dateOfBirth) return null;
  const birth = Date.parse(`${dateOfBirth}T12:00:00`);
  if (!Number.isFinite(birth)) return null;
  const now = new Date();
  const dob = new Date(birth);
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return Math.max(0, age);
}

function money(cents: number) {
  return formatMoneyFromCents(cents);
}

function formatScheduleDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function normalizeLocationId(value: string | null | undefined) {
  return value?.trim() || DEFAULT_BJJ_LOCATION_ID;
}

export default function BJJRegistration() {
  const [, navigate] = useLocation();
  const sessionQuery = useGuardianSession();
  const participantsQuery = useGuardianStudents(Boolean(sessionQuery.data?.authenticated));
  const programsQuery = useProgramsCatalog();
  const [selectedParticipantId, setSelectedParticipantId] = React.useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = React.useState(DEFAULT_BJJ_LOCATION_ID);
  const [selectedTrack, setSelectedTrack] = React.useState<string>("");
  const [experienceLevel, setExperienceLevel] = React.useState("beginner");
  const [paymentChoice, setPaymentChoice] = React.useState<"full" | "plan">("full");
  const [lineNotes, setLineNotes] = React.useState("");
  const [cart, setCart] = React.useState(() => loadFamilyCart());
  const [error, setError] = React.useState<string | null>(null);

  const session = sessionQuery.data;
  const participants = participantsQuery.data?.students ?? [];
  const program = programsQuery.data?.programs.find((item) => item.slug === "bjj");
  const bjjLocations = React.useMemo(() => {
    const catalogLocations = programsQuery.data?.locations ?? [];
    const sessionLocationIds = new Set((program?.sessions ?? []).map((session) => normalizeLocationId(session.location_id)));
    const matching = catalogLocations.filter((location) => sessionLocationIds.has(location.id));
    const fallback = [
      { id: "mississauga", display_name: "Mississauga", city: "Mississauga", address: "918 Dundas St. West, Mississauga", status: "active" },
      { id: "oakville", display_name: "Oakville", city: "Oakville", address: "Oakville, ON", status: "active" },
    ];
    return matching.length > 0 ? matching : fallback;
  }, [program?.sessions, programsQuery.data?.locations]);
  const selectedLocation = bjjLocations.find((location) => location.id === selectedLocationId) ?? bjjLocations[0] ?? null;
  const semester = program?.active_semester ?? null;
  const prices = program?.prices ?? [];
  const sessions = React.useMemo(
    () => (program?.sessions ?? []).filter((session) => normalizeLocationId(session.location_id) === selectedLocationId),
    [program?.sessions, selectedLocationId],
  );

  React.useEffect(() => {
    if (!selectedParticipantId && participants[0]?.id) {
      setSelectedParticipantId(participants[0].id);
    }
  }, [participants, selectedParticipantId]);

  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId) ?? null;
  const selectedParticipantAge = computeAge(selectedParticipant?.date_of_birth);
  const eligibleGroups = BJJ_MARKETING_GROUPS.filter((group: BjjMarketingGroup) =>
    group.sessions.some((sessionOption) =>
      selectedParticipantAge != null &&
      isEligibleForBjjTrack(sessionOption.trackKey, selectedParticipantAge, selectedParticipant?.gender ?? "") &&
      sessions.some((session) => session.age_group === sessionOption.trackKey),
    ),
  );

  const selectedPrice =
    prices.find((price) => price.age_group === selectedTrack && price.location_id && normalizeLocationId(price.location_id) === selectedLocationId) ??
    prices.find((price) => price.age_group === selectedTrack && !price.location_id) ??
    prices.find((price) => price.age_group === selectedTrack) ??
    null;
  const selectedSession = sessions.find((item) => item.age_group === selectedTrack) ?? null;
  const selectedParticipantExistingCartTracks = (cart?.lines ?? [])
    .filter((line) =>
      line.programSlug !== "archery" &&
      selectedParticipant &&
      line.participant.fullName.trim().toLowerCase() === selectedParticipant.full_name.trim().toLowerCase() &&
      line.participant.dateOfBirth === selectedParticipant.date_of_birth,
    )
    .map((line) => ({
      track: "bjjTrack" in line.programDetails.programSpecific
        ? String(line.programDetails.programSpecific.bjjTrack ?? "")
        : "",
      locationId: normalizeLocationId(
        "locationId" in line.programDetails.programSpecific
          ? String(line.programDetails.programSpecific.locationId ?? "")
          : undefined,
      ),
    }));
  const selectedParticipantHasWomenWeeklyInCart = selectedParticipantExistingCartTracks.some((entry) => isWomenWeeklyBjjTrack(entry.track));
  const selectedTrackIsSecondWomenWeekly =
    isWomenWeeklyBjjTrack(selectedTrack) &&
    selectedParticipantExistingCartTracks.some((entry) => isWomenWeeklyBjjTrack(entry.track) && entry.track !== selectedTrack);
  const selectedTrackIsBlockedSelfDefense =
    isWomenSelfDefenseBjjTrack(selectedTrack) && selectedParticipantHasWomenWeeklyInCart;
  const cartLinePreview =
    selectedTrack && selectedPrice && selectedSession
      ? computeLineTuitionCents({
          track: selectedTrack,
          priceId: selectedPrice.id,
          programPriceAmount: selectedPrice.amount,
          programPriceRegFee: selectedPrice.registration_fee,
          programPriceFrequency: selectedPrice.frequency,
          priceMetadataJson: selectedPrice.metadata,
          paymentChoice,
          siblingRankAmongKidsStudents: 0,
          semester,
          womenSecondWeeklyClass: selectedTrackIsSecondWomenWeekly,
        })
      : null;
  const paymentSplit = cartLinePreview ? splitPaymentPlan(cartLinePreview.afterSiblingCents, paymentChoice) : null;
  const laterPaymentDate = computeLaterPaymentDateIso(semester);
  const laterPaymentLabel = formatScheduleDate(laterPaymentDate);

  if (sessionQuery.isLoading || participantsQuery.isLoading || programsQuery.isLoading) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-5xl px-6 pt-28">
          <StudioBlock id="registration.bjj.loading" label="BJJ loading state">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <StudioText
                k="registration.bjj.loadingCopy"
                defaultText="Loading your account and BJJ classes..."
                as="p"
                className="text-sm text-charcoal/70"
              />
            </PremiumCard>
          </StudioBlock>
        </main>
      </MotionPage>
    );
  }

  if (!session?.authenticated) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <StudioBlock id="registration.bjj.signin" label="BJJ account sign-in gate">
            <SectionHeader
              eyebrow={<StudioText k="registration.bjj.signinEyebrow" defaultText="BJJ Registration" />}
              title={<StudioText k="registration.bjj.signinTitle" defaultText="Sign in before you register" />}
              className="mb-6"
            />
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <StudioText
                k="registration.bjj.signinCopy"
                defaultText="Sign in so your participants, waivers, payment plan, and later charges stay tied to the right account."
                as="p"
                className="text-sm leading-relaxed text-charcoal/70"
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/register?next=%2Fprograms%2Fbjj%2Fregister">Sign in to register</Link>
                </ClayButton>
                <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/trial">Start with a free trial</Link>
                </OutlineButton>
              </div>
            </PremiumCard>
          </StudioBlock>
        </main>
      </MotionPage>
    );
  }

  if (!session.accountComplete || participants.length === 0) {
    return (
      <MotionPage className="min-h-screen bg-cream pb-24">
        <div className="noise-overlay" />
        <main className="mx-auto max-w-3xl px-6 pt-28">
          <StudioBlock id="registration.bjj.account-setup" label="BJJ account setup gate">
            <SectionHeader
              eyebrow={<StudioText k="registration.bjj.setupEyebrow" defaultText="BJJ Registration" />}
              title={<StudioText k="registration.bjj.setupTitle" defaultText="Finish your account setup first" />}
              className="mb-6"
            />
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
              <StudioText
                k="registration.bjj.setupCopy"
                defaultText="Before registration opens, we need the account details and at least one participant profile saved. Adults can add themselves only. Families can add children and themselves under the same account."
                as="p"
                className="text-sm leading-relaxed text-charcoal/70"
              />
              <div className="mt-6">
                <ClayButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                  <Link href="/register">Finish account setup</Link>
                </ClayButton>
              </div>
            </PremiumCard>
          </StudioBlock>
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

  return (
    <MotionPage className="min-h-screen bg-cream pb-24">
      <div className="noise-overlay" />
      <main className="mx-auto max-w-7xl px-6 pt-28">
        <StudioBlock id="registration.bjj.hero" label="BJJ registration hero">
          <SectionHeader
            eyebrow={<StudioText k="registration.bjj.heroEyebrow" defaultText="BJJ Registration" />}
            title={<StudioText k="registration.bjj.heroTitle" defaultText="Choose BJJ classes" />}
            className="mb-6"
          />
          <StudioText
            k="registration.bjj.heroPitch"
            defaultText="Choose a location and participant first, then we'll show only the BJJ tracks that fit. Add one or more registrations before checkout."
            as="p"
            className="mb-8 max-w-3xl text-sm leading-relaxed text-charcoal/70"
          />
        </StudioBlock>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.15fr_0.95fr]">
          <StudioBlock id="registration.bjj.participants" label="BJJ participant chooser">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Location</div>
            <div className="mb-6 grid gap-3">
              {bjjLocations.map((location) => {
                const active = location.id === selectedLocationId;
                return (
                  <button
                    key={location.id}
                    type="button"
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                      active ? "border-moss bg-moss/5" : "border-charcoal/10 bg-cream/40 hover:bg-cream/70"
                    }`}
                    onClick={() => {
                      setSelectedLocationId(location.id);
                      setSelectedTrack("");
                    }}
                  >
                    <div className="text-sm font-medium text-charcoal">{location.display_name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                      {location.address ?? location.city}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Participants</div>
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
                    onClick={() => {
                      setSelectedParticipantId(participant.id);
                      setSelectedTrack("");
                    }}
                  >
                    <div className="text-sm font-medium text-charcoal">{participant.full_name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                      {participant.participant_type === "self" ? "Self" : "Child"} · {participant.gender ?? "Gender needed"} · {computeAge(participant.date_of_birth) ?? "—"} years
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
          </StudioBlock>

          <StudioBlock id="registration.bjj.tracks" label="BJJ track chooser">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Eligible BJJ tracks</div>
            <div className="mb-4 rounded-2xl border border-charcoal/10 bg-cream/40 p-4 text-sm text-charcoal/70">
              Showing classes for <strong className="text-charcoal">{selectedLocation?.display_name ?? "selected location"}</strong>.
            </div>
            {!selectedParticipant ? (
              <div className="text-sm text-charcoal/70">Select a participant to begin.</div>
            ) : eligibleGroups.length === 0 ? (
              <div className="text-sm text-charcoal/70">No live BJJ track matches this participant yet.</div>
            ) : (
              <div className="space-y-5">
                {eligibleGroups.map((group: BjjMarketingGroup) => (
                  <div key={group.key}>
                    <div className="mb-3 text-sm font-medium text-charcoal">{group.label}</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.sessions.map((option) => {
                        const selected = selectedTrack === option.trackKey;
                        const optionSessions = sessions.filter((session) => session.age_group === option.trackKey);
                        const optionPrice =
                          prices.find((price) => price.age_group === option.trackKey && price.location_id && normalizeLocationId(price.location_id) === selectedLocationId) ??
                          prices.find((price) => price.age_group === option.trackKey && !price.location_id) ??
                          prices.find((price) => price.age_group === option.trackKey);
                        return (
                          <button
                            key={option.trackKey}
                            type="button"
                            className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                              selected ? "border-moss bg-moss/5" : "border-charcoal/10 bg-cream/40 hover:bg-cream/70"
                            }`}
                            onClick={() => setSelectedTrack(option.trackKey)}
                          >
                            <div className="text-sm font-medium text-charcoal">{option.label}</div>
                            <div className="mt-2 text-sm text-charcoal/65">
                              {optionSessions.length > 0
                                ? optionSessions
                                    .map((session) => `${selectedLocation?.display_name ?? "Location"} · ${session.day_of_week ?? "Day"} ${session.start_time ?? ""}-${session.end_time ?? ""}`)
                                    .join(" / ")
                                : option.scheduleLabel}
                            </div>
                            <div className="mt-3 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                              {optionPrice
                                ? isWomenSelfDefenseBjjTrack(option.trackKey)
                                  ? "$25 one-time"
                                  : selectedParticipantExistingCartTracks.some((entry) => isWomenWeeklyBjjTrack(entry.track) && entry.track !== option.trackKey) && isWomenWeeklyBjjTrack(option.trackKey)
                                    ? "$50 second class"
                                    : `${money(optionPrice.amount)} per class`
                                : `${money(BJJ_TRACK_BY_KEY[option.trackKey].defaultPerClassCents)} per class`}
                            </div>
                            {isWomenSelfDefenseBjjTrack(option.trackKey) ? (
                              <div className="mt-2 text-xs leading-relaxed text-charcoal/55">
                                For women who are not registered for Tuesday or Thursday BJJ.
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-charcoal">
                    Experience level
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger className="mt-2 bg-cream/50 border-charcoal/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="some-experience">Some experience</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="text-sm text-charcoal">
                    Payment option
                    <Select value={paymentChoice} onValueChange={(value) => setPaymentChoice(value as "full" | "plan")}>
                      <SelectTrigger className="mt-2 bg-cream/50 border-charcoal/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Pay in full</SelectItem>
                        <SelectItem value="plan">
                          {laterPaymentLabel ? `Pay half now, half on ${laterPaymentLabel}` : "Pay half now, half later"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="text-sm text-charcoal md:col-span-2">
                    Notes (optional)
                    <Textarea
                      className="mt-2 min-h-[110px] bg-cream/50 border-charcoal/10"
                      value={lineNotes}
                      onChange={(event) => setLineNotes(event.target.value)}
                    />
                  </label>
                </div>

                {paymentSplit ? (
                  <div className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4 text-sm text-charcoal/70">
                    <div>Estimated full-term total: <strong className="text-charcoal">{money(cartLinePreview?.afterSiblingCents ?? 0)}</strong></div>
                    <div className="mt-1">
                      {paymentChoice === "plan"
                        ? `Due today ${money(paymentSplit.dueToday)} and ${money(paymentSplit.dueLater)}${laterPaymentLabel ? ` on ${laterPaymentLabel}` : " later"}.`
                        : `Due today ${money(paymentSplit.dueToday)}.`}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                      {selectedTrackIsSecondWomenWeekly
                        ? "Second weekly women’s class pricing is applied here."
                        : selectedTrackIsBlockedSelfDefense
                          ? "Self-defense is only available when this participant is not taking Tuesday or Thursday women’s BJJ."
                          : "Staff discount codes can adjust totals at checkout when provided."}
                    </div>
                  </div>
                ) : null}

                {error ? <div className="text-sm text-clay">{error}</div> : null}

                <div className="flex flex-wrap gap-3">
                  <ClayButton
                    className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                    onClick={() => {
                      if (!selectedParticipant || !selectedTrack || !selectedPrice || !selectedSession) {
                        setError("Choose a location, participant, and eligible BJJ track first.");
                        return;
                      }
                      if (selectedTrackIsBlockedSelfDefense) {
                        setError("Women self-defense is for participants who are not registered for Tuesday or Thursday women’s BJJ.");
                        return;
                      }
                      const duplicate = (cart?.lines ?? []).some((line) =>
                        line.programSlug !== "archery" &&
                        line.participant.fullName.trim().toLowerCase() === selectedParticipant.full_name.trim().toLowerCase() &&
                        line.participant.dateOfBirth === selectedParticipant.date_of_birth &&
                        line.programDetails.programSpecific.bjjTrack === selectedTrack &&
                        normalizeLocationId(line.programDetails.programSpecific.locationId) === selectedLocationId,
                      );
                      if (duplicate) {
                        setError("That exact participant, location, and BJJ offering is already in the cart.");
                        return;
                      }
                      addLineToFamilyCart(accountSnapshot, {
                        participant: {
                          id: selectedParticipant.id,
                          participantType: selectedParticipant.participant_type,
                          fullName: selectedParticipant.full_name,
                          dateOfBirth: selectedParticipant.date_of_birth ?? "",
                          gender: selectedParticipant.gender ?? "",
                          medicalNotes: selectedParticipant.medical_notes ?? "",
                          experienceLevel,
                        },
                        paymentChoice,
                        programDetails: {
                          sessionId: selectedSession.id,
                          priceId: selectedPrice.id,
                          programSpecific: {
                            bjjTrack: selectedTrack,
                            locationId: selectedLocationId,
                            notes: lineNotes.trim() || undefined,
                          },
                        },
                      });
                      setCart(loadFamilyCart());
                      setError(null);
                      setSelectedTrack("");
                      setLineNotes("");
                    }}
                  >
                    Add this registration
                  </ClayButton>
                  <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                    <Link href="/registration/cart">Review checkout</Link>
                  </OutlineButton>
                </div>
              </div>
            )}
            </PremiumCard>
          </StudioBlock>

          <StudioBlock id="registration.bjj.cart" label="BJJ cart preview">
            <PremiumCard className="border border-charcoal/10 bg-white p-6">
            <div className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-moss mb-3">Your registrations</div>
            <div className="space-y-3">
              {(cart?.lines ?? []).map((line) => (
                <div key={line.id} className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-charcoal">{line.participant.fullName}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-charcoal/55">
                          {line.programSlug === "archery"
                            ? "Traditional Archery"
                            : Object.prototype.hasOwnProperty.call(BJJ_TRACK_BY_KEY, line.programDetails.programSpecific.bjjTrack)
                            ? `${bjjLocations.find((location) => location.id === normalizeLocationId(line.programDetails.programSpecific.locationId))?.display_name ?? "Mississauga"} · ${BJJ_TRACK_BY_KEY[line.programDetails.programSpecific.bjjTrack as keyof typeof BJJ_TRACK_BY_KEY].registerLabel}`
                            : line.programDetails.programSpecific.bjjTrack}
                        </div>
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
              ))}
              {(cart?.lines ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-charcoal/15 bg-cream/40 p-4 text-sm text-charcoal/65">
                  No registrations added yet.
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ClayButton
                className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]"
                disabled={!cart || cart.lines.length === 0}
                onClick={() => navigate("/registration/cart")}
              >
                Continue to checkout
              </ClayButton>
              <OutlineButton asChild className="px-6 py-3 text-[11px] uppercase tracking-[0.18em]">
                <Link href="/register">Manage account</Link>
              </OutlineButton>
            </div>
            </PremiumCard>
          </StudioBlock>
        </div>
      </main>
    </MotionPage>
  );
}
