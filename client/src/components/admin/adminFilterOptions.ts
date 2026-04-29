export type AdminFilterState = {
  programId: string;
  locationId: string;
  track: string;
  registrationStatus: string;
  paymentState: string;
  review: string;
  q: string;
  includeSuperseded: boolean;
  dateFrom: string;
  dateTo: string;
  sort: "newest" | "oldest" | "student" | "guardian" | "amount_desc" | "amount_asc";
};

export type AdminProgramOption = { id: string; name: string; slug: string };
export type AdminLocationOption = { id: string; display_name: string };
export type AdminTrackOption = { value: string; label: string };

export const DEFAULT_ADMIN_FILTERS: AdminFilterState = {
  programId: "all",
  locationId: "all",
  track: "all",
  registrationStatus: "all",
  paymentState: "all",
  review: "all",
  q: "",
  includeSuperseded: false,
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

export const PAYMENT_STATE_OPTIONS = [
  { value: "all", label: "All payments" },
  { value: "paid_full", label: "Paid in full" },
  { value: "paid_partial", label: "Half paid" },
  { value: "pending", label: "Unpaid / pending" },
  { value: "failed", label: "Failed" },
  { value: "superseded", label: "Superseded" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function buildAdminQuery(basePath: string, filters: AdminFilterState) {
  const sp = new URLSearchParams();
  if (filters.programId !== "all") sp.set("programId", filters.programId);
  if (filters.locationId !== "all") sp.set("locationId", filters.locationId);
  if (filters.track !== "all") sp.set("track", filters.track);
  if (filters.registrationStatus !== "all") sp.set("registrationStatus", filters.registrationStatus);
  if (filters.paymentState !== "all") sp.set("paymentState", filters.paymentState);
  if (filters.review !== "all") sp.set("review", filters.review);
  if (filters.q.trim()) sp.set("q", filters.q.trim());
  if (filters.includeSuperseded) sp.set("includeSuperseded", "1");
  if (filters.dateFrom) sp.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) sp.set("dateTo", filters.dateTo);
  if (filters.sort !== "newest") sp.set("sort", filters.sort);
  const qs = sp.toString();
  return `${basePath}${qs ? `?${qs}` : ""}`;
}
