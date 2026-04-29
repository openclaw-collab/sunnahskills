const CART_KEY = "sunnah-family-cart-v2";
const CHECKOUT_KEY = "sunnah-family-checkout-v1";

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

export type BjjFamilyCartLine = {
  id: string;
  programSlug?: "bjj";
  participant: ParticipantCartSnapshot;
  paymentChoice: "full" | "plan";
  discountCode?: string;
  programDetails: {
    sessionId: number;
    priceId: number;
    programSpecific: {
      bjjTrack: string;
      locationId?: string;
      notes?: string;
    };
  };
};

export type ArcheryFamilyCartLine = {
  id: string;
  programSlug: "archery";
  participant: ParticipantCartSnapshot;
  paymentChoice: "full";
  discountCode?: string;
  programDetails: {
    sessionId: number;
    priceId: number | null;
    programSpecific: {
      eyeDominance: "right" | "left";
      dominantHand?: string;
      experience?: string;
      notes?: string;
    };
  };
};

export type FamilyCartLine = BjjFamilyCartLine | ArcheryFamilyCartLine;

export type FamilyCart = {
  account: AccountCartSnapshot;
  lines: FamilyCartLine[];
};

export type PendingFamilyCheckout = {
  orderId: number;
  firstRegistrationId: number | null;
  prorationCode: string;
  cartFingerprint: string;
};

function normalizeText(value: string | undefined | null) {
  return String(value ?? "").trim();
}

function normalizeCode(value: string | undefined | null) {
  return normalizeText(value).toUpperCase();
}

export function buildFamilyCartFingerprint(cart: FamilyCart, prorationCode = "") {
  return JSON.stringify({
    account: {
      fullName: normalizeText(cart.account.fullName),
      email: normalizeText(cart.account.email).toLowerCase(),
      phone: normalizeText(cart.account.phone),
      emergencyContactName: normalizeText(cart.account.emergencyContactName),
      emergencyContactPhone: normalizeText(cart.account.emergencyContactPhone),
      accountRole: cart.account.accountRole,
      notes: normalizeText(cart.account.notes),
    },
    prorationCode: normalizeCode(prorationCode),
    lines: [...cart.lines]
      .map((line) => ({
        id: normalizeText(line.id),
        programSlug: normalizeText(line.programSlug || "bjj"),
        paymentChoice: line.paymentChoice,
        discountCode: normalizeCode(line.discountCode),
        participant: {
          id: line.participant.id ?? null,
          participantType: line.participant.participantType,
          fullName: normalizeText(line.participant.fullName),
          dateOfBirth: normalizeText(line.participant.dateOfBirth),
          gender: normalizeText(line.participant.gender),
          medicalNotes: normalizeText(line.participant.medicalNotes),
          experienceLevel: normalizeText(line.participant.experienceLevel),
        },
        programDetails: {
          sessionId: Number(line.programDetails.sessionId ?? 0),
          priceId: Number(line.programDetails.priceId ?? 0),
          programSpecific: {
            ...line.programDetails.programSpecific,
            notes: normalizeText(line.programDetails.programSpecific.notes),
          },
        },
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  });
}

export function loadPendingFamilyCheckout(): PendingFamilyCheckout | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingFamilyCheckout;
    if (!Number.isInteger(data?.orderId) || data.orderId <= 0) return null;
    return {
      orderId: data.orderId,
      firstRegistrationId: Number.isInteger(data?.firstRegistrationId) ? data.firstRegistrationId : null,
      prorationCode: normalizeCode(data?.prorationCode),
      cartFingerprint: normalizeText(data?.cartFingerprint),
    };
  } catch {
    return null;
  }
}

export function savePendingFamilyCheckout(checkout: PendingFamilyCheckout) {
  try {
    localStorage.setItem(CHECKOUT_KEY, JSON.stringify({
      ...checkout,
      prorationCode: normalizeCode(checkout.prorationCode),
    }));
  } catch {
    /* ignore */
  }
}

export function clearPendingFamilyCheckout() {
  try {
    localStorage.removeItem(CHECKOUT_KEY);
  } catch {
    /* ignore */
  }
}

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
  clearPendingFamilyCheckout();
}

export function addLineToFamilyCart(account: AccountCartSnapshot, line: Omit<FamilyCartLine, "id">) {
  const existing = loadFamilyCart();
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const next: FamilyCart = {
    account,
    lines: [...(existing?.lines ?? []), { ...line, id } as FamilyCartLine],
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
