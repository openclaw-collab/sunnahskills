import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, CheckboxGroup, SelectField } from "./FormControls";
import type { RegistrationStepProps } from "@/components/registration/steps";
import type { BjjSpecific, ArcherySpecific, OutdoorSpecific, BullyproofingSpecific } from "@/hooks/useRegistration";
import { useProgramsCatalog, type CatalogOffer } from "@/hooks/useProgramsCatalog";
import {
  archeryDominantHandOptions,
  archeryExperienceOptions,
  bjjTrackOptions,
  bjjTrialClassOptions,
  bullyproofingAgeGroupOptions,
  bullyproofingConcernOptions,
  outdoorGearOptions,
  outdoorWorkshopDateOptions,
} from "@shared/registration-options";
import { StudioBlock } from "@/studio/StudioBlock";

function BjjFields({ draft, updateDraft }: RegistrationStepProps) {
  const { data, isLoading } = useProgramsCatalog();
  const ps = draft.programDetails.programSpecific as BjjSpecific;
  const bjj = data?.programs?.find((p) => p.id === "bjj");
  const sessions = (bjj?.sessions ?? []).filter((s) => s.age_group === ps.bjjTrack);
  const prices = (bjj?.prices ?? []).filter((p) => p.age_group === ps.bjjTrack);
  const priceRow = prices[0] ?? null;

  const set = (patch: Partial<BjjSpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as BjjSpecific,
      },
    }));

  const sessionOptions = sessions.map((s) => ({
    value: String(s.id),
    label: `${s.day_of_week ?? "Day"} ${s.start_time ?? ""}–${s.end_time ?? ""} · ${s.name}`,
  }));

  return (
    <div className="space-y-6">
      {isLoading && (
        <p className="font-body text-sm text-charcoal/60">Loading class schedule…</p>
      )}
      <RadioGroup
        label="Class track"
        name="bjj-track"
        value={ps.bjjTrack}
        onChange={(v) => {
          const track = v as BjjSpecific["bjjTrack"];
          const list = (bjj?.sessions ?? []).filter((s) => s.age_group === track);
          const pr = (bjj?.prices ?? []).find((p) => p.age_group === track);
          updateDraft((prev) => ({
            ...prev,
            programDetails: {
              ...prev.programDetails,
              sessionId: list.length === 1 ? list[0].id : null,
              priceId: pr?.id ?? null,
              programSpecific: { ...(prev.programDetails.programSpecific as BjjSpecific), bjjTrack: track },
            },
          }));
        }}
        options={bjjTrackOptions.map((opt) => ({
          ...opt,
          sublabel:
            opt.value === "women-11-tue" || opt.value === "women-11-thu"
              ? "Separate enrollments — both nights means double tuition"
              : undefined,
        }))}
      />
      {ps.bjjTrack && sessions.length > 1 && (
        <SelectField
          label="Pick your session"
          value={draft.programDetails.sessionId ? String(draft.programDetails.sessionId) : ""}
          onChange={(v) => {
            const sid = Number(v);
            updateDraft((prev) => ({
              ...prev,
              programDetails: {
                ...prev.programDetails,
                sessionId: Number.isFinite(sid) ? sid : null,
                priceId: priceRow?.id ?? null,
              },
            }));
          }}
          options={sessionOptions}
          placeholder="Select day and time"
        />
      )}
      {ps.bjjTrack && sessions.length === 1 && (
        <p className="rounded-xl border border-charcoal/10 bg-moss/5 px-4 py-3 font-body text-xs text-charcoal/70 leading-relaxed">
          <strong>Session:</strong> {sessionOptions[0]?.label}
          {ps.bjjTrack.startsWith("girls") || ps.bjjTrack.startsWith("boys") ? (
            <>
              {" "}
              · On Tuesdays, kids class follows the women&apos;s block — different rooms/tracks.
            </>
          ) : null}
        </p>
      )}
      <RadioGroup
        label="Would you like to start with a trial class?"
        name="bjj-trial"
        value={ps.trialClass}
        onChange={(v) => set({ trialClass: v as BjjSpecific["trialClass"] })}
        options={[...bjjTrialClassOptions]}
      />
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Goals, concerns, or questions for the coach"
          rows={3}
        />
      </div>
    </div>
  );
}

function ArcheryFields({ draft, updateDraft }: RegistrationStepProps) {
  const { data, isLoading } = useProgramsCatalog();
  const ps = draft.programDetails.programSpecific as ArcherySpecific;
  const archery = data?.programs?.find((program) => program.slug === "archery");
  const [revealedOffer, setRevealedOffer] = React.useState<CatalogOffer | null>(null);
  const [revealError, setRevealError] = React.useState<string | null>(null);
  const [revealing, setRevealing] = React.useState(false);
  const set = (patch: Partial<ArcherySpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as ArcherySpecific,
      },
    }));

  const publicOffers = archery?.offers ?? [];
  const offers = React.useMemo(() => {
    if (!revealedOffer) return publicOffers;
    return publicOffers.some((offer) => offer.id === revealedOffer.id) ? publicOffers : [...publicOffers, revealedOffer];
  }, [publicOffers, revealedOffer]);

  const selectedOffer = offers.find((offer) => offer.id === draft.programDetails.offerId) ?? null;
  const selectedSession = selectedOffer?.sessions.find((session) => session.id === draft.programDetails.sessionId) ?? null;
  const sessionOptions = (selectedOffer?.sessions ?? []).map((session) => ({
    value: String(session.id),
    label: `${session.start_time ?? ""}–${session.end_time ?? ""}${session.name ? ` · ${session.name}` : ""}`,
  }));

  function formatOfferDates(offer: CatalogOffer) {
    if (offer.dates.length > 0) {
      return offer.dates
        .map((date) =>
          new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        )
        .join(", ");
    }
    return offer.sessions[0]?.season ?? "Dates announced in the offer details";
  }

  function syncOffer(nextOffer: CatalogOffer) {
    const defaultSession = nextOffer.sessions[0] ?? null;
    const defaultPrice = nextOffer.prices[0] ?? null;
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        offerId: nextOffer.id,
        sessionId: defaultSession?.id ?? null,
        priceId: defaultPrice?.id ?? null,
        programSpecific: {
          ...(prev.programDetails.programSpecific as ArcherySpecific),
          sessionDate: nextOffer.dates[0] ?? defaultSession?.start_date ?? defaultSession?.season ?? "",
        },
      },
    }));
  }

  async function revealOffer(inputCode?: string, silent = false) {
    const accessCode = (inputCode ?? draft.programDetails.accessCode).trim();
    if (!accessCode) {
      if (!silent) setRevealError("Enter a valid staff code.");
      return;
    }
    setRevealing(true);
    if (!silent) setRevealError(null);
    try {
      const response = await fetch("/api/programs/reveal-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programSlug: "archery", accessCode }),
      });
      const payload = (await response.json().catch(() => null)) as { offer?: CatalogOffer; error?: string } | null;
      if (!response.ok || !payload?.offer) {
        throw new Error(payload?.error ?? "That code is not valid right now.");
      }
      setRevealedOffer(payload.offer);
    } catch (error) {
      if (!silent) {
        setRevealError(error instanceof Error ? error.message : "That code is not valid right now.");
      }
    } finally {
      setRevealing(false);
    }
  }

  React.useEffect(() => {
    const persistedCode = draft.programDetails.accessCode.trim();
    if (!persistedCode || revealedOffer) return;
    void revealOffer(persistedCode, true);
  }, [draft.programDetails.accessCode, revealedOffer]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4 space-y-4">
        <div>
          <div className="font-body text-sm text-charcoal font-medium">Have a staff code?</div>
          <p className="font-body text-xs text-charcoal/60">
            Enter the code here if Sunnah Skills gave you one.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            aria-label="Archery staff code"
            value={draft.programDetails.accessCode}
            onChange={(event) =>
              updateDraft((prev) => ({
                ...prev,
                programDetails: { ...prev.programDetails, accessCode: event.target.value.toUpperCase() },
              }))
            }
            placeholder="Enter staff code"
            className="bg-white border-charcoal/10"
          />
          <button
            type="button"
            className="rounded-xl border border-charcoal/15 bg-white px-4 py-2.5 text-[11px] font-mono-label uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-charcoal/30"
            onClick={() => {
              void revealOffer();
            }}
          >
            {revealing ? "Checking..." : "Apply code"}
          </button>
        </div>
        {revealError ? <p className="font-body text-xs text-clay">{revealError}</p> : null}
      </div>
      {isLoading ? <p className="font-body text-sm text-charcoal/60">Loading archery offers…</p> : null}
      {offers.length > 0 ? (
        <RadioGroup
          label="Choose your archery offer"
          name="archery-offer"
          value={draft.programDetails.offerId ? String(draft.programDetails.offerId) : ""}
          onChange={(value) => {
            const nextOffer = offers.find((entry) => String(entry.id) === value);
            if (nextOffer) syncOffer(nextOffer);
          }}
          options={offers.map((offer) => ({
            value: String(offer.id),
            label: offer.name,
            sublabel: `${formatOfferDates(offer)} · ${
              offer.prices[0]
                ? new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD" }).format(offer.prices[0].amount / 100)
                : "Price set in admin"
            }${offer.is_private ? " · Private" : ""}`,
          }))}
        />
      ) : null}
      {selectedOffer ? (
        <div className="rounded-2xl border border-charcoal/10 bg-moss/5 px-4 py-3 text-sm text-charcoal/75">
          <div className="font-medium text-charcoal">{selectedOffer.name}</div>
          <div className="mt-1">{selectedOffer.description ?? selectedOffer.confirmation_notes ?? "Offer details will appear here."}</div>
          <div className="mt-2 text-xs uppercase tracking-[0.16em] text-charcoal/50">Dates: {formatOfferDates(selectedOffer)}</div>
        </div>
      ) : null}
      <RadioGroup
        label="Dominant hand"
        name="archery-hand"
        value={ps.dominantHand}
        onChange={(v) => set({ dominantHand: v as ArcherySpecific["dominantHand"] })}
        options={[...archeryDominantHandOptions]}
      />
      <RadioGroup
        label="Prior archery experience"
        name="archery-exp"
        value={ps.experience}
        onChange={(v) => set({ experience: v as ArcherySpecific["experience"] })}
        options={archeryExperienceOptions.map((opt) => ({
          ...opt,
          sublabel:
            opt.value === "never" ? "Complete beginner" : opt.value === "some" ? "A few sessions" : "Regular practice",
        }))}
      />
      {selectedOffer ? (
        <SelectField
          label="Choose your time slot"
          value={draft.programDetails.sessionId ? String(draft.programDetails.sessionId) : ""}
          onChange={(value) => {
            const session = selectedOffer.sessions.find((entry) => String(entry.id) === value) ?? null;
            updateDraft((prev) => ({
              ...prev,
              programDetails: {
                ...prev.programDetails,
                sessionId: session?.id ?? null,
                priceId: selectedOffer.prices[0]?.id ?? null,
                programSpecific: {
                  ...(prev.programDetails.programSpecific as ArcherySpecific),
                  sessionDate: session?.start_date ?? selectedOffer.dates[0] ?? session?.season ?? "",
                },
              },
            }));
          }}
          options={sessionOptions}
          placeholder="Select a time slot"
        />
      ) : null}
      {selectedSession ? (
        <p className="rounded-xl border border-charcoal/10 bg-white px-4 py-3 font-body text-xs text-charcoal/70 leading-relaxed">
          <strong>Schedule:</strong> {selectedSession.day_of_week ?? "Day"} {selectedSession.start_time ?? ""}–{selectedSession.end_time ?? ""} · {formatOfferDates(selectedOffer!)}
        </p>
      ) : null}
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Equipment questions, goals, or accessibility needs"
          rows={3}
        />
      </div>
    </div>
  );
}

function OutdoorFields({ draft, updateDraft }: RegistrationStepProps) {
  const ps = draft.programDetails.programSpecific as OutdoorSpecific;
  const set = (patch: Partial<OutdoorSpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as OutdoorSpecific,
      },
    }));

  return (
    <div className="space-y-6">
      <SelectField
        label="Workshop date"
        value={ps.workshopDate}
        onChange={(v) => set({ workshopDate: v })}
        options={[...outdoorWorkshopDateOptions]}
        placeholder="Select a date"
      />
      <CheckboxGroup
        label="Gear checklist — please confirm you'll bring:"
        options={[...outdoorGearOptions]}
        values={ps.gear}
        onChange={(v) => set({ gear: v })}
      />
      <div className="rounded-xl border border-charcoal/10 bg-moss/5 px-4 py-3">
        <p className="font-body text-xs text-charcoal/60 leading-relaxed">
          All four items are required for participation. Students without proper gear may not be able to join the full session.
        </p>
      </div>
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Workshop goals, outdoor comfort level, or questions"
          rows={3}
        />
      </div>
    </div>
  );
}

function BullyproofingFields({ draft, updateDraft }: RegistrationStepProps) {
  const ps = draft.programDetails.programSpecific as BullyproofingSpecific;
  const set = (patch: Partial<BullyproofingSpecific>) =>
    updateDraft((prev) => ({
      ...prev,
      programDetails: {
        ...prev.programDetails,
        programSpecific: { ...prev.programDetails.programSpecific, ...patch } as BullyproofingSpecific,
      },
    }));

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Primary concern"
        name="bp-concern"
        value={ps.concernType}
        onChange={(v) => set({ concernType: v as BullyproofingSpecific["concernType"] })}
        options={bullyproofingConcernOptions.map((opt) => ({
          ...opt,
          sublabel:
            opt.value === "being-bullied"
              ? "Needs assertiveness + tools"
              : opt.value === "exhibiting"
                ? "Learning empathy + boundaries"
                : "Proactive development",
        }))}
      />
      <RadioGroup
        label="Student age group"
        name="bp-age"
        value={ps.ageGroup}
        onChange={(v) => set({ ageGroup: v as BullyproofingSpecific["ageGroup"] })}
        options={[...bullyproofingAgeGroupOptions]}
      />
      <div className="space-y-2">
        <label className="font-body text-sm text-charcoal font-medium">Anything else we should know? (optional)</label>
        <Textarea
          value={ps.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Context, specific situations, or what you want your child to learn"
          rows={3}
        />
      </div>
    </div>
  );
}

export function StepProgramDetails(props: RegistrationStepProps) {
  const { draft, updateDraft } = props;
  const slug = draft.programSlug;

  return (
    <StudioBlock id={`registration.${slug}.details-step`} label={`${slug} program details step`}>
      <div className="space-y-8">
        {slug === "bjj" && <BjjFields {...props} />}
        {slug === "archery" && <ArcheryFields {...props} />}
        {slug === "outdoor" && <OutdoorFields {...props} />}
        {slug === "bullyproofing" && <BullyproofingFields {...props} />}

        {/* Sibling discount — shown for all programs */}
        <div className="border-t border-charcoal/10 pt-6">
          {slug === "bjj" ? (
            <div className="mb-6">
              <RadioGroup
                label="Tuition payment"
                name="bjj-payment-choice"
                value={draft.programDetails.paymentChoice}
                onChange={(v) =>
                  updateDraft((prev) => ({
                    ...prev,
                    programDetails: {
                      ...prev.programDetails,
                      paymentChoice: v as "full" | "plan",
                    },
                  }))
                }
                options={[
                  { value: "full", label: "Pay in full today", sublabel: "Single payment for this enrollment" },
                  {
                    value: "plan",
                    label: "Pay part today",
                    sublabel:
                      "Half of tuition after discounts is due today; the rest is due on the semester’s second-payment date. In family cart checkout you’ll see the exact dollar amount and date and must agree before paying.",
                  },
                ]}
              />
            </div>
          ) : null}
          <RadioGroup
            label="Registering siblings at the same time?"
            name="sibling-count"
            value={String(draft.programDetails.siblingCount)}
            onChange={(v) =>
              updateDraft((prev) => ({
                ...prev,
                programDetails: {
                  ...prev.programDetails,
                  siblingCount: Number(v) as 0 | 1 | 2,
                },
              }))
            }
            options={[
              { value: "0", label: "No siblings", sublabel: "No discount" },
              { value: "1", label: "1 sibling", sublabel: "Each child sibling line gets −10%" },
              { value: "2", label: "2+ siblings", sublabel: "All child sibling lines get −10%" },
            ]}
          />
          {draft.programDetails.siblingCount > 0 && (
            <p className="mt-2 font-body text-xs text-moss">
              {slug === "bjj"
                ? "Sibling discount applies to child participant profiles in the same family. Each eligible child line receives 10% off, including teen tracks."
                : "A 10% sibling discount will be applied at checkout."}
            </p>
          )}
        </div>
      </div>
    </StudioBlock>
  );
}
