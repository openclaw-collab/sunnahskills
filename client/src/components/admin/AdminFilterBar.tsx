import React from "react";
import { RefreshCw } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_ADMIN_FILTERS,
  PAYMENT_STATE_OPTIONS,
  type AdminFilterState,
  type AdminLocationOption,
  type AdminProgramOption,
  type AdminTrackOption,
} from "@/components/admin/adminFilterOptions";

type Props = {
  value: AdminFilterState;
  programs: AdminProgramOption[];
  locations: AdminLocationOption[];
  tracks: AdminTrackOption[];
  mode: "registrations" | "payments";
  refreshing: boolean;
  onChange: (next: AdminFilterState) => void;
  onRefresh: () => void;
};

export function AdminFilterBar({ value, programs, locations, tracks, mode, refreshing, onChange, onRefresh }: Props) {
  const patch = (partial: Partial<AdminFilterState>) => onChange({ ...value, ...partial });

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-cream/45 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Select value={value.programId} onValueChange={(programId) => patch({ programId, track: "all" })}>
          <SelectTrigger className="bg-white border-charcoal/10">
            <SelectValue placeholder="All programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.locationId} onValueChange={(locationId) => patch({ locationId })}>
          <SelectTrigger className="bg-white border-charcoal/10">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {mode === "registrations" ? (
          <Select value={value.track} onValueChange={(track) => patch({ track })}>
            <SelectTrigger className="bg-white border-charcoal/10">
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tracks</SelectItem>
              {tracks.map((track) => (
                <SelectItem key={track.value} value={track.value}>
                  {track.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={value.review} onValueChange={(review) => patch({ review })}>
            <SelectTrigger className="bg-white border-charcoal/10">
              <SelectValue placeholder="Review state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All review states</SelectItem>
              <SelectItem value="none">No review</SelectItem>
              <SelectItem value="required">Needs review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={value.paymentState} onValueChange={(paymentState) => patch({ paymentState })}>
          <SelectTrigger className="bg-white border-charcoal/10">
            <SelectValue placeholder="Payment state" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.sort} onValueChange={(sort) => patch({ sort: sort as AdminFilterState["sort"] })}>
          <SelectTrigger className="bg-white border-charcoal/10">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="student">Student A-Z</SelectItem>
            <SelectItem value="guardian">Guardian A-Z</SelectItem>
            <SelectItem value="amount_desc">Amount high-low</SelectItem>
            <SelectItem value="amount_asc">Amount low-high</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={value.q}
          onChange={(event) => patch({ q: event.target.value })}
          placeholder="Parent, student, email, order..."
          className="bg-white border-charcoal/10"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-3 py-2 text-[11px] font-mono-label uppercase tracking-[0.14em] text-charcoal/65">
          <Checkbox
            checked={value.includeSuperseded}
            onCheckedChange={(checked) => patch({ includeSuperseded: checked === true })}
            aria-label="Show superseded"
          />
          Show superseded
        </label>
        <div className="flex gap-2">
          <OutlineButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => onChange(DEFAULT_ADMIN_FILTERS)}>
            Reset
          </OutlineButton>
          <ClayButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            {refreshing ? "Refreshing" : "Refresh"}
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
