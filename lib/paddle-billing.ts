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

export type PaddleWebhookEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: Record<string, unknown>;
};

export type VerifiedPaddleSubscription = {
  subscriptionId: string;
  customerId: string;
  userId: string;
  status: string;
  transactionId?: string;
  nextBilledAt?: string;
  scheduledChange: Record<string, unknown> | null;
};

export function getPaddleSubscriptionAccess(status: string) {
  return status === "active" || status === "trialing";
}

export function getPaddleFunnelEventType(eventType: string) {
  if (eventType === "transaction.completed") {
    return "payment_succeeded" as const;
  }

  if (eventType === "transaction.payment_failed" || eventType === "subscription.past_due") {
    return "payment_failed" as const;
  }

  if (eventType === "subscription.activated" || eventType === "subscription.trialing") {
    return "subscription_activated" as const;
  }

  if (eventType === "subscription.canceled") {
    return "subscription_canceled" as const;
  }
}

export function getVerifiedPaddleSubscription(
  event: PaddleWebhookEvent,
  secret: string,
  expectedPriceId?: string,
): VerifiedPaddleSubscription | null {
  if (!event.event_type.startsWith("subscription.")) {
    return null;
  }

  const subscriptionId = readString(event.data.id);
  const customerId = readString(event.data.customer_id);
  const customData = readRecord(event.data.custom_data);
  const userId = readString(customData?.kevixo_user_id);
  const binding = readString(customData?.kevixo_checkout_binding);

  if (!subscriptionId || !customerId || !userId || !verifyCheckoutBinding(binding, userId, secret)) {
    return null;
  }

  if (expectedPriceId && !hasPaddlePrice(event.data.items, expectedPriceId)) {
    return null;
  }

  return {
    subscriptionId,
    customerId,
    userId,
    status: readString(event.data.status) ?? "expired",
    transactionId: readString(event.data.transaction_id),
    nextBilledAt: readString(event.data.next_billed_at),
    scheduledChange: readRecord(event.data.scheduled_change),
  };
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
    if (!/^[a-f0-9]{64}$/i.test(signature)) {
      return false;
    }

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

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasPaddlePrice(value: unknown, expectedPriceId: string) {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some((item) => {
    const price = readRecord(readRecord(item)?.price);
    return readString(price?.id) === expectedPriceId;
  });
}
