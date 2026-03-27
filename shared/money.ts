export const DEFAULT_CURRENCY = "cad" as const;
export const DEFAULT_CURRENCY_DISPLAY = "CAD" as const;
export const DEFAULT_MONEY_LOCALE = "en-CA" as const;

export function normalizeCurrencyCode(currency?: string | null, fallback = DEFAULT_CURRENCY) {
  const normalized = String(currency ?? "")
    .trim()
    .toLowerCase();
  return normalized || fallback;
}

export function normalizeCurrencyDisplay(currency?: string | null, fallback = DEFAULT_CURRENCY) {
  return normalizeCurrencyCode(currency, fallback).toUpperCase();
}

export function formatMoneyFromCents(
  amountCents: number,
  options?: {
    currency?: string | null;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) {
  const value = Number.isFinite(amountCents) ? amountCents : 0;
  return new Intl.NumberFormat(options?.locale ?? DEFAULT_MONEY_LOCALE, {
    style: "currency",
    currency: normalizeCurrencyDisplay(options?.currency),
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value / 100);
}
