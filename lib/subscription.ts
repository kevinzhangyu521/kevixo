import { createClient } from "@supabase/supabase-js";
import { getUserEntitlements } from "@/lib/entitlements";

export type Subscription = {
  id: string;
  userId: string;
  plan: "free" | "coach";
  status: string;
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  currentPeriodEnd?: string;
  nextBilledAt?: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  current_period_end: string | null;
  next_billed_at: string | null;
};

const tableName = "subscriptions";
const checkoutBlockingStatuses = ["active", "trialing", "past_due", "paused"] as const;
export type CheckoutBlockingSubscriptionStatus = (typeof checkoutBlockingStatuses)[number];

export function selectBlockingPaddleSubscriptionStatus(statuses: string[]): CheckoutBlockingSubscriptionStatus | null {
  for (const status of checkoutBlockingStatuses) {
    if (statuses.includes(status)) return status;
  }
  return null;
}

export async function getBlockingPaddleSubscriptionStatus(userId: string) {
  const { data, error } = await getSubscriptionAdminClient()
    .from(tableName)
    .select("status")
    .eq("user_id", userId)
    .eq("provider", "paddle")
    .returns<Array<{ status: string }>>();

  if (error) throw new Error(error.message);
  return selectBlockingPaddleSubscriptionStatus((data ?? []).map((row) => row.status));
}

export async function getSubscription(userId: string): Promise<Subscription> {
  const supabase = getSubscriptionAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("id, user_id, plan, status, paddle_customer_id, paddle_subscription_id, current_period_end, next_billed_at")
    .eq("user_id", userId)
    .eq("provider", "paddle")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      id: "",
      userId,
      plan: "free",
      status: "free",
    };
  }

  return fromRow(data);
}

export async function isCoachUser(userId: string) {
  return (await getUserEntitlements(userId)).isCoach;
}

export async function requireCoach(userId: string) {
  const subscription = await getSubscription(userId);
  const isActive = await isCoachUser(userId);

  if (!isActive) {
    throw new Error("Available in Kevixo Coach");
  }

  return subscription;
}

function fromRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan === "coach" ? "coach" : "free",
    status: row.status,
    paddleCustomerId: row.paddle_customer_id ?? undefined,
    paddleSubscriptionId: row.paddle_subscription_id ?? undefined,
    currentPeriodEnd: row.current_period_end ?? undefined,
    nextBilledAt: row.next_billed_at ?? undefined,
  };
}

function getSubscriptionAdminClient() {
  const supabaseUrl = normalizeSupabaseProjectUrl(readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const serviceRoleKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Subscription access is not configured.");
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
