import { createHmac, timingSafeEqual } from "crypto";

export const paddleSubscriptionStatuses = [
  "active",
  "trialing",
  "past_due",
  "paused",
  "canceled",
  "expired",
] as const;

export type PaddleSubscriptionStatus = (typeof paddleSubscriptionStatuses)[number];

export function getPaddleSubscriptionAccess(status: string) {
  return status === "active" || status === "trialing";
}

export function isPaddleEventNewer(incoming: string, current?: string | null) {
  if (!current) {
    return true;
  }

  return new Date(incoming).getTime() > new Date(current).getTime();
}

export function createCheckoutBinding(userId: string, secret: string, issuedAt = Math.floor(Date.now() / 1000)) {
  const payload = `${userId}.${issuedAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyCheckoutBinding(binding: string | undefined, userId: string, secret: string) {
  if (!binding) {
    return false;
  }

  const [bindingUserId, issuedAt, signature, ...unexpectedParts] = binding.split(".");

  if (!bindingUserId || !issuedAt || !signature || unexpectedParts.length > 0 || bindingUserId !== userId) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expected = sign(`${bindingUserId}.${issuedAt}`, secret);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

export function verifyPaddleSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) {
    return false;
  }

  const values = new Map(
    signatureHeader.split(";").map((part) => {
      const [key, value] = part.trim().split("=", 2);
      return [key, value];
    }),
  );
  const timestamp = values.get("ts");
  const signatures = signatureHeader
    .split(";")
    .map((part) => part.trim().split("=", 2))
    .filter(([key, value]) => key === "h1" && Boolean(value))
    .map(([, value]) => value!);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const expected = sign(`${timestamp}:${rawBody}`, secret);
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "hex");
    return (
      signatureBuffer.length === expectedBuffer.length &&
      timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  });
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
