export type DiscountType = "percentage" | "fixed" | "sibling";

export type DiscountRow = {
  id: number;
  code: string;
  type: DiscountType;
  value: number;
  program_id: string | null;
  max_uses: number | null;
  current_uses: number | null;
  valid_from: string | null;
  valid_until: string | null;
  active?: number;
};

export type DiscountInvalidReason =
  | "missing"
  | "not_found"
  | "program_mismatch"
  | "max_uses_reached"
  | "not_started"
  | "expired"
  | "unsupported_type";

export function discountInvalidReasonMessage(reason: DiscountInvalidReason) {
  switch (reason) {
    case "missing":
    case "not_found":
      return "That discount code is invalid.";
    case "program_mismatch":
      return "That discount code does not apply to this registration.";
    case "max_uses_reached":
      return "That discount code has already been fully used.";
    case "not_started":
      return "That discount code is not active yet.";
    case "expired":
      return "That discount code has expired.";
    case "unsupported_type":
      return "Sibling pricing is already applied automatically on eligible registrations.";
  }
}

export async function loadDiscountRow(db: D1Database, code: string) {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return null;
  return db
    .prepare(
      `SELECT id, code, type, value, program_id, max_uses, current_uses, valid_from, valid_until, active
       FROM discounts
       WHERE code = ? AND active = 1
       LIMIT 1`,
    )
    .bind(normalized)
    .first<DiscountRow>();
}

export function normalizeDiscountCode(code: string | null | undefined) {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

export function validateDiscountRow(
  row: DiscountRow | null,
  options: {
    programId?: string | null;
    allowSiblingType?: boolean;
    nowMs?: number;
  } = {},
): { valid: true; row: DiscountRow } | { valid: false; reason: DiscountInvalidReason } {
  if (!row) return { valid: false, reason: "not_found" };
  if (row.program_id && options.programId && row.program_id !== options.programId) {
    return { valid: false, reason: "program_mismatch" };
  }
  if (!options.allowSiblingType && row.type === "sibling") {
    return { valid: false, reason: "unsupported_type" };
  }
  if (row.max_uses != null && row.current_uses != null && Number(row.current_uses) >= Number(row.max_uses)) {
    return { valid: false, reason: "max_uses_reached" };
  }

  const now = options.nowMs ?? Date.now();
  const validFrom = row.valid_from ? Date.parse(String(row.valid_from)) : null;
  const validUntil = row.valid_until ? Date.parse(String(row.valid_until)) : null;
  if (validFrom && now < validFrom) return { valid: false, reason: "not_started" };
  if (validUntil && now > validUntil) return { valid: false, reason: "expired" };

  return { valid: true, row };
}

export async function resolveDiscountCode(
  db: D1Database,
  code: string | null | undefined,
  options: {
    programId?: string | null;
    allowSiblingType?: boolean;
    nowMs?: number;
  } = {},
) {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return { valid: false as const, reason: "missing" as const, row: null };
  const row = await loadDiscountRow(db, normalized);
  const validation = validateDiscountRow(row, options);
  if (!validation.valid) return { valid: false as const, reason: validation.reason, row: null };
  return { valid: true as const, reason: null, row: validation.row };
}

export function promoDiscountForSubtotal(subtotalAfterSiblingCents: number, discount: Pick<DiscountRow, "type" | "value">) {
  const subtotal = Math.max(0, Math.round(Number(subtotalAfterSiblingCents ?? 0)));
  if (discount.type === "percentage") {
    return Math.max(0, Math.min(subtotal, Math.round((subtotal * Number(discount.value)) / 100)));
  }
  if (discount.type === "fixed") {
    return Math.max(0, Math.min(subtotal, Math.round(Number(discount.value))));
  }
  return 0;
}
