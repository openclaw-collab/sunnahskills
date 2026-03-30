type ReconcileEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export type ReconcileTokenPayload = {
  enrollmentOrderId: number;
  paymentIntentId: string;
  issuedAt: number;
};

const MAX_TOKEN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getSigningSecret(env: ReconcileEnv) {
  return env.STRIPE_WEBHOOK_SECRET?.trim() || env.STRIPE_SECRET_KEY?.trim() || "";
}

async function sign(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function issuePaymentReconcileToken(
  env: ReconcileEnv,
  data: { enrollmentOrderId: number; paymentIntentId: string },
) {
  const secret = getSigningSecret(env);
  if (!secret) throw new Error("Signing secret not configured");

  const payload: ReconcileTokenPayload = {
    enrollmentOrderId: data.enrollmentOrderId,
    paymentIntentId: data.paymentIntentId,
    issuedAt: Date.now(),
  };
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const encodedSignature = await sign(secret, encodedPayload);
  return `${encodedPayload}.${encodedSignature}`;
}

export async function verifyPaymentReconcileToken(env: ReconcileEnv, token: string | null | undefined) {
  const trimmed = String(token ?? "").trim();
  const secret = getSigningSecret(env);
  if (!trimmed || !secret) return null;

  const [encodedPayload, encodedSignature] = trimmed.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = await sign(secret, encodedPayload);
  if (!timingSafeEqual(encodedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as Partial<ReconcileTokenPayload>;
    if (!Number.isInteger(payload.enrollmentOrderId) || payload.enrollmentOrderId! <= 0) return null;
    if (typeof payload.paymentIntentId !== "string" || !payload.paymentIntentId.trim()) return null;
    if (!Number.isInteger(payload.issuedAt) || payload.issuedAt! <= 0) return null;
    if (Date.now() - payload.issuedAt > MAX_TOKEN_AGE_MS) return null;
    return payload as ReconcileTokenPayload;
  } catch {
    return null;
  }
}
