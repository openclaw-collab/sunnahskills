import type { RegistrationDraft } from "@/hooks/useRegistration";

const CART_KEY = "sunnah-family-cart-v1";

export type FamilyCartLine = {
  id: string;
  student: RegistrationDraft["student"];
  programDetails: RegistrationDraft["programDetails"];
};

export type FamilyCart = {
  guardian: RegistrationDraft["guardian"];
  lines: FamilyCartLine[];
};

export function loadFamilyCart(): FamilyCart | null {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FamilyCart;
    if (!data?.guardian || !Array.isArray(data.lines)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveFamilyCart(cart: FamilyCart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* ignore */
  }
}

export function clearFamilyCart() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    /* ignore */
  }
}

export function addLineToFamilyCart(guardian: RegistrationDraft["guardian"], line: Omit<FamilyCartLine, "id">) {
  const existing = loadFamilyCart();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const next: FamilyCart = {
    guardian: existing?.guardian ?? guardian,
    lines: [...(existing?.lines ?? []), { ...line, id }],
  };
  saveFamilyCart(next);
  return next;
}

export function removeCartLine(lineId: string) {
  const existing = loadFamilyCart();
  if (!existing) return;
  const lines = existing.lines.filter((l) => l.id !== lineId);
  if (lines.length === 0) {
    clearFamilyCart();
    return;
  }
  saveFamilyCart({ ...existing, lines });
}
