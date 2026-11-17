import { createClient } from "@supabase/supabase-js";

export type MembershipPlan = "free" | "coach";
export type EntitlementSource = "free" | "paddle" | "existing_coach_protection";

export type UserEntitlements = {
  plan: MembershipPlan;
  isCoach: boolean;
  source: EntitlementSource;
};

export type EntitlementSubscription = {
  provider: string;
  status: string;
};

export type ExistingCoachProtection = {
  protected: boolean;
  reason: "verified_existing_coach";
};

export type EntitlementDependencies = {
  listSubscriptions: (userId: string) => Promise<EntitlementSubscription[]>;
  getExistingCoachProtection: (userId: string) => Promise<ExistingCoachProtection | null>;
};

type ResolveEntitlementsInput = {
  subscriptions: EntitlementSubscription[];
  existingCoachProtection?: ExistingCoachProtection | null;
  profilePlan?: MembershipPlan | null;
};

const coachStatuses = new Set(["active", "trialing"]);

export function resolveEntitlements(input: ResolveEntitlementsInput): UserEntitlements {
  const hasActivePaddleSubscription = input.subscriptions.some(
    (subscription) =>
      subscription.provider === "paddle" && coachStatuses.has(subscription.status),
  );

  if (hasActivePaddleSubscription) {
    return { plan: "coach", isCoach: true, source: "paddle" };
  }

  if (input.existingCoachProtection?.protected) {
    return { plan: "coach", isCoach: true, source: "existing_coach_protection" };
  }

  return { plan: "free", isCoach: false, source: "free" };
}

export async function getUserEntitlements(
  userId: string,
  dependencies: EntitlementDependencies = defaultDependencies,
) {
  const [subscriptions, existingCoachProtection] = await Promise.all([
    dependencies.listSubscriptions(userId),
    dependencies.getExistingCoachProtection(userId),
  ]);

  return resolveEntitlements({ subscriptions, existingCoachProtection });
}

async function listPaddleSubscriptions(userId: string) {
  const { data, error } = await getEntitlementsAdminClient()
    .from("subscriptions")
    .select("provider, status")
    .eq("user_id", userId)
    .eq("provider", "paddle")
    .returns<EntitlementSubscription[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getNoExistingCoachProtection() {
  // Protection is deliberately opt-in. A production-backed loader must only be added
  // after the existing Coach cohort has been verified; profiles.plan is not evidence.
  return null;
}

const defaultDependencies: EntitlementDependencies = {
  listSubscriptions: listPaddleSubscriptions,
  getExistingCoachProtection: getNoExistingCoachProtection,
};

function getEntitlementsAdminClient() {
  const supabaseUrl = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Membership entitlements are not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
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
