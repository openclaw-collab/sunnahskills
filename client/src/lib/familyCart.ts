const CART_KEY = "sunnah-family-cart-v2";

export type AccountCartSnapshot = {
  fullName: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  accountRole: "parent_guardian" | "adult_student";
  notes?: string;
};

export type ParticipantCartSnapshot = {
  id?: number | null;
  participantType: "self" | "child";
  fullName: string;
  dateOfBirth: string;
  gender: string;
  medicalNotes?: string;
  experienceLevel: string;
};

export type FamilyCartLine = {
  id: string;
  participant: ParticipantCartSnapshot;
  paymentChoice: "full" | "plan";
  discountCode?: string;
  programDetails: {
    sessionId: number;
    priceId: number;
    programSpecific: {
      bjjTrack: string;
      notes?: string;
    };
  };
};

export type FamilyCart = {
  account: AccountCartSnapshot;
  lines: FamilyCartLine[];
};

export function loadFamilyCart(): FamilyCart | null {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FamilyCart;
    if (!data?.account || !Array.isArray(data.lines)) return null;
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

export function addLineToFamilyCart(account: AccountCartSnapshot, line: Omit<FamilyCartLine, "id">) {
  const existing = loadFamilyCart();
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const next: FamilyCart = {
    account,
    lines: [...(existing?.lines ?? []), { ...line, id }],
  };
  saveFamilyCart(next);
  return next;
}

export function removeCartLine(lineId: string) {
  const existing = loadFamilyCart();
  if (!existing) return;
  const lines = existing.lines.filter((line) => line.id !== lineId);
  if (lines.length === 0) {
    clearFamilyCart();
    return;
  }
  saveFamilyCart({ ...existing, lines });
}

export function updateCartLine(
  lineId: string,
  updater: (line: FamilyCartLine) => FamilyCartLine,
) {
  const existing = loadFamilyCart();
  if (!existing) return null;
  const lines = existing.lines.map((line) => (line.id === lineId ? updater(line) : line));
  const next = { ...existing, lines };
  saveFamilyCart(next);
  return next;
}
