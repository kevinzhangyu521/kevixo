import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type SubscriptionUpsertInput = {
  userId: string;
  plan: "coach";
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
};

type SubscriptionCustomerRow = {
  stripe_customer_id: string | null;
};

const subscriptionsTable = "subscriptions";

export function getStripe() {
  const secretKey = readRuntimeEnv("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey);
}

export function getCoachPriceId() {
  const priceId = readRuntimeEnv("STRIPE_COACH_MONTHLY_PRICE_ID");

  if (!priceId) {
    throw new Error("Stripe Coach price is not configured.");
  }

  return priceId;
}

export function getStripeWebhookSecret() {
  const webhookSecret = readRuntimeEnv("STRIPE_WEBHOOK_SECRET");

  if (!webhookSecret) {
    throw new Error("Stripe webhook is not configured.");
  }

  return webhookSecret;
}

export async function getStripeCustomerIdForUser(userId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(subscriptionsTable)
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionCustomerRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.stripe_customer_id ?? undefined;
}

export async function upsertSubscription(input: SubscriptionUpsertInput) {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from(subscriptionsTable).upsert(
    {
      user_id: input.userId,
      plan: input.plan,
      status: input.status,
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      current_period_end: input.currentPeriodEnd ?? null,
      updated_at: now,
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertStripeSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };

  if (!userId) {
    throw new Error("Stripe subscription is missing user metadata.");
  }

  await upsertSubscription({
    userId,
    plan: "coach",
    status: subscription.status,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscriptionWithPeriod.current_period_end
      ? new Date(subscriptionWithPeriod.current_period_end * 1000).toISOString()
      : undefined,
  });
}

function getAdminClient() {
  const supabaseUrl = normalizeSupabaseProjectUrl(readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const serviceRoleKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase subscription admin access is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeSupabaseProjectUrl(value: string | undefined) {
  const rawUrl = value?.trim();

  if (!rawUrl) {
    return undefined;
  }

  const parsedUrl = new URL(rawUrl);

  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be exactly https://<project>.supabase.co.");
  }

  return parsedUrl.origin;
}

function readRuntimeEnv(name: string) {
  return process.env[name]?.trim();
}
