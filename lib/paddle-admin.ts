import { createClient } from "@supabase/supabase-js";
import {
  createCheckoutBinding,
  isPaddleEventNewer,
  verifyCheckoutBinding,
  verifyPaddleSignature,
} from "@/lib/paddle-billing";
import { insertGrowthEvent } from "@/lib/growth-events";

const subscriptionsTable = "subscriptions";
const webhookEventsTable = "paddle_webhook_events";
const paddleApiUrl = "https://api.paddle.com";

type PaddleEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: Record<string, unknown>;
};

type PaddleSubscriptionRow = {
  user_id: string;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  last_event_occurred_at: string | null;
};

export function getPaddleCheckoutConfiguration(user: { id: string; email?: string }) {
  const clientToken = readRequiredEnv("NEXT_PUBLIC_PADDLE_CLIENT_SIDE_TOKEN");
  const priceId = readRequiredEnv("NEXT_PUBLIC_PADDLE_COACH_MONTHLY_PRICE_ID");
  const apiKey = readRequiredEnv("PADDLE_API_KEY");

  return {
    clientToken,
    environment: "production" as const,
    priceId,
    customerEmail: user.email ?? "",
    customData: {
      kevixo_user_id: user.id,
      kevixo_checkout_binding: createCheckoutBinding(user.id, apiKey),
    },
  };
}

export function verifyIncomingPaddleWebhook(body: string, signature: string | null) {
  return verifyPaddleSignature(body, signature, readRequiredEnv("PADDLE_WEBHOOK_SECRET"));
}

export async function createPaddlePortalUrl(userId: string) {
  const subscription = await getLatestPaddleSubscription(userId);

  if (!subscription?.paddle_customer_id) {
    throw new Error("No billing account found yet. Choose Coach to get started.");
  }

  const response = await fetch(
    `${paddleApiUrl}/customers/${subscription.paddle_customer_id}/portal-sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${readRequiredEnv("PADDLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_ids: subscription.paddle_subscription_id
          ? [subscription.paddle_subscription_id]
          : [],
      }),
    },
  );
  const payload = (await response.json()) as {
    data?: { urls?: { general?: { overview?: string } } };
    error?: { detail?: string };
  };

  if (!response.ok || !payload.data?.urls?.general?.overview) {
    throw new Error(payload.error?.detail ?? "Billing management could not be opened.");
  }

  return payload.data.urls.general.overview;
}

export async function processPaddleWebhook(event: PaddleEvent) {
  const supabase = getAdminClient();
  const { error: eventError } = await supabase.from(webhookEventsTable).insert({
    event_id: event.event_id,
    event_type: event.event_type,
    occurred_at: event.occurred_at,
  });

  if (eventError?.code === "23505") {
    return;
  }

  if (eventError) {
    throw new Error(eventError.message);
  }

  try {
    if (event.event_type.startsWith("subscription.")) {
      await upsertPaddleSubscription(event);
    } else if (event.event_type.startsWith("transaction.")) {
      await updateTransactionState(event);
    } else if (event.event_type.startsWith("adjustment.")) {
      await updateAdjustmentState(event);
    }

    await trackPaddleLifecycleEvent(event);
  } catch (error) {
    await supabase.from(webhookEventsTable).delete().eq("event_id", event.event_id);
    throw error;
  }
}

async function upsertPaddleSubscription(event: PaddleEvent) {
  const data = event.data;
  const subscriptionId = readString(data.id);
  const customerId = readString(data.customer_id);
  const status = readString(data.status) ?? "expired";
  const customData = readRecord(data.custom_data);
  const userId = readString(customData?.kevixo_user_id);
  const binding = readString(customData?.kevixo_checkout_binding);

  if (!subscriptionId || !customerId || !userId || !verifyCheckoutBinding(binding, userId, readRequiredEnv("PADDLE_API_KEY"))) {
    throw new Error("Paddle subscription is missing a valid Kevixo account binding.");
  }

  const supabase = getAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from(subscriptionsTable)
    .select("last_event_occurred_at")
    .eq("paddle_subscription_id", subscriptionId)
    .maybeSingle<{ last_event_occurred_at: string | null }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!isPaddleEventNewer(event.occurred_at, existing?.last_event_occurred_at)) {
    return;
  }

  const { error } = await supabase.from(subscriptionsTable).upsert(
    {
      user_id: userId,
      provider: "paddle",
      plan: "coach",
      status,
      paddle_customer_id: customerId,
      paddle_subscription_id: subscriptionId,
      paddle_transaction_id: readString(data.transaction_id),
      current_period_end: readString(data.next_billed_at),
      next_billed_at: readString(data.next_billed_at),
      scheduled_change: readRecord(data.scheduled_change),
      last_event_occurred_at: event.occurred_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function updateTransactionState(event: PaddleEvent) {
  const data = event.data;
  const subscriptionId = readString(data.subscription_id);

  if (!subscriptionId) {
    return;
  }

  const status = readString(data.status) ?? event.event_type.replace("transaction.", "");
  const { error } = await getAdminClient()
    .from(subscriptionsTable)
    .update({
      paddle_transaction_id: readString(data.id),
      last_payment_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscriptionId);

  if (error) {
    throw new Error(error.message);
  }
}

async function updateAdjustmentState(event: PaddleEvent) {
  const data = event.data;
  const subscriptionId = readString(data.subscription_id);

  if (!subscriptionId) {
    return;
  }

  const { error } = await getAdminClient()
    .from(subscriptionsTable)
    .update({
      last_adjustment_action: readString(data.action),
      last_adjustment_status: readString(data.status),
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscriptionId);

  if (error) {
    throw new Error(error.message);
  }
}

async function trackPaddleLifecycleEvent(event: PaddleEvent) {
  const customData = readRecord(event.data.custom_data);
  const userId = readString(customData?.kevixo_user_id) ?? (await findUserId(event.data));

  if (!userId) {
    return;
  }

  const eventType = toGrowthEventType(event.event_type);

  if (!eventType) {
    return;
  }

  try {
    await insertGrowthEvent({ eventType, userId, sourcePage: "/pricing" });
  } catch (error) {
    console.error("[Kevixo Paddle analytics failed]", error instanceof Error ? error.message : error);
  }
}

async function findUserId(data: Record<string, unknown>) {
  const subscriptionId = readString(data.subscription_id) ?? readString(data.id);

  if (!subscriptionId) {
    return undefined;
  }

  const { data: subscription, error } = await getAdminClient()
    .from(subscriptionsTable)
    .select("user_id")
    .eq("paddle_subscription_id", subscriptionId)
    .maybeSingle<{ user_id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return subscription?.user_id;
}

function toGrowthEventType(eventType: string) {
  if (eventType === "subscription.activated" || eventType === "subscription.trialing") {
    return "subscription_activated" as const;
  }

  if (eventType === "transaction.payment_failed" || eventType === "subscription.past_due") {
    return "payment_failed" as const;
  }

  if (eventType === "subscription.canceled") {
    return "subscription_canceled" as const;
  }
}

async function getLatestPaddleSubscription(userId: string) {
  const { data, error } = await getAdminClient()
    .from(subscriptionsTable)
    .select("user_id, paddle_customer_id, paddle_subscription_id, last_event_occurred_at")
    .eq("user_id", userId)
    .eq("provider", "paddle")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<PaddleSubscriptionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function getAdminClient() {
  return createClient(readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
