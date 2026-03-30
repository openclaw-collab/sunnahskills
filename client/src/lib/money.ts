import { formatMoneyFromCents } from "@shared/money";

/**
 * Convenience wrapper for formatting money from cents.
 * Prefer importing this from @/lib/money instead of redefining locally.
 */
export function money(cents: number): string {
  return formatMoneyFromCents(cents);
}
