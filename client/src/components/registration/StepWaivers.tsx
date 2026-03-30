import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { RegistrationStepProps } from "@/components/registration/steps";
import { StudioBlock } from "@/studio/StudioBlock";
import { isMediaWaiverExemptBjjTrack } from "@shared/bjjCatalog";

function WaiverRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-cream p-4">
      <Checkbox aria-label={label} checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
      <div className="space-y-1">
        <div className="font-body text-sm text-charcoal">{label}</div>
        <div className="font-body text-xs text-charcoal/60">
          You’ll review the full policy text during final submission.
        </div>
      </div>
    </div>
  );
}

export function StepWaivers({ draft, updateDraft }: RegistrationStepProps) {
  const selectedBjjTrack = draft.programSlug === "bjj"
    ? String((draft.programDetails.programSpecific as { bjjTrack?: string })?.bjjTrack ?? "")
    : "";
  const requiresPhotoConsent = !(draft.programSlug === "bjj" && isMediaWaiverExemptBjjTrack(selectedBjjTrack));

  return (
    <StudioBlock id={`registration.${draft.programSlug}.waivers-step`} label="Waivers step">
      <div className="space-y-4">
        <WaiverRow
          label="I agree to the liability waiver."
          checked={draft.waivers.liabilityWaiver}
          onCheckedChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              waivers: { ...prev.waivers, liabilityWaiver: next },
            }))
          }
        />
        {requiresPhotoConsent ? (
          <WaiverRow
            label="I consent to photo/media use for program communications."
            checked={draft.waivers.photoConsent}
            onCheckedChange={(next) =>
              updateDraft((prev) => ({
                ...prev,
                waivers: { ...prev.waivers, photoConsent: next },
              }))
            }
          />
        ) : (
          <div className="rounded-2xl border border-charcoal/10 bg-cream p-4 font-body text-sm text-charcoal/70">
            Media waiver does not apply to women&apos;s or girls&apos; programs.
          </div>
        )}
        <WaiverRow
          label="I consent to medical treatment in case of emergency."
          checked={draft.waivers.medicalConsent}
          onCheckedChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              waivers: { ...prev.waivers, medicalConsent: next },
            }))
          }
        />
        <WaiverRow
          label="I agree to the terms and policies."
          checked={draft.waivers.termsAgreement}
          onCheckedChange={(next) =>
            updateDraft((prev) => ({
              ...prev,
              waivers: { ...prev.waivers, termsAgreement: next },
            }))
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="waiver-signature" className="font-body text-sm text-charcoal">Typed legal signature</label>
            <Input
              id="waiver-signature"
              value={draft.waivers.signatureText}
              onChange={(e) =>
                updateDraft((prev) => ({
                  ...prev,
                  waivers: { ...prev.waivers, signatureText: e.target.value },
                }))
              }
              placeholder="Type full name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="waiver-signed-at" className="font-body text-sm text-charcoal">Date</label>
            <Input
              id="waiver-signed-at"
              value={draft.waivers.signedAt}
              onChange={(e) =>
                updateDraft((prev) => ({
                  ...prev,
                  waivers: { ...prev.waivers, signedAt: e.target.value },
                }))
              }
              type="date"
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>
      </div>
    </StudioBlock>
  );
}
