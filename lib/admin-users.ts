import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/supabase-auth";

export type AdminUserRole = "user" | "admin";
export type AdminUserPlan = "free" | "pro";
export type AdminUserStatus = "active" | "disabled";

export type AdminUser = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  joinedAt: string;
  plan: AdminUserPlan;
  status: AdminUserStatus;
  role: AdminUserRole;
  reviewCount: number;
};

type ProfileRow = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AdminUserRole | null;
  plan: AdminUserPlan | null;
  status: AdminUserStatus | null;
  created_at: string;
  updated_at: string;
};

type ReviewCountRow = {
  user_id: string | null;
};

type AdminAuthorizationResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 | 500; error: string };

const profileTable = "profiles";
const reviewTable = "hand_reviews";

export async function authorizeAdminUser(request: Request): Promise<AdminAuthorizationResult> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return { ok: false, status: 401, error: "Please sign in with an admin account." };
  }

  const supabase = getAdminUsersClient();
  const { data, error } = await supabase
    .from(profileTable)
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role: AdminUserRole | null; status: AdminUserStatus | null }>();

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }

  if (!data || data.role !== "admin" || data.status !== "active") {
    return { ok: false, status: 403, error: "Access denied." };
  }

  return { ok: true, userId: user.id };
}

export async function listAdminUsers() {
  const supabase = getAdminUsersClient();
  const { data, error } = await supabase
    .from(profileTable)
    .select("id, user_id, email, display_name, avatar_url, role, plan, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .returns<ProfileRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const reviewCounts = await listReviewCounts();

  return data.map((row) => fromProfileRow(row, reviewCounts.get(row.user_id) ?? 0));
}

export async function updateAdminUser({
  plan,
  role,
  status,
  userId,
}: {
  userId: string;
  plan?: AdminUserPlan;
  role?: AdminUserRole;
  status?: AdminUserStatus;
}) {
  const updatePayload: Partial<Pick<ProfileRow, "plan" | "role" | "status" | "updated_at">> = {
    updated_at: new Date().toISOString(),
  };

  if (plan) {
    updatePayload.plan = plan;
  }

  if (role) {
    updatePayload.role = role;
  }

  if (status) {
    updatePayload.status = status;
  }

  if (Object.keys(updatePayload).length === 1) {
    throw new Error("Choose a change before saving.");
  }

  const supabase = getAdminUsersClient();
  const { data, error } = await supabase
    .from(profileTable)
    .update(updatePayload)
    .eq("id", userId)
    .select("id, user_id, email, display_name, avatar_url, role, plan, status, created_at, updated_at")
    .single<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  const reviewCounts = await listReviewCounts();

  return fromProfileRow(data, reviewCounts.get(data.user_id) ?? 0);
}

async function listReviewCounts() {
  const supabase = getAdminUsersClient();
  const counts = new Map<string, number>();
  const { data, error } = await supabase
    .from(reviewTable)
    .select("user_id")
    .not("user_id", "is", null)
    .returns<ReviewCountRow[]>();

  if (error) {
    return counts;
  }

  for (const row of data) {
    if (row.user_id) {
      counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
    }
  }

  return counts;
}

function fromProfileRow(row: ProfileRow, reviewCount: number): AdminUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    joinedAt: row.created_at,
    plan: row.plan ?? "free",
    status: row.status ?? "active",
    role: row.role ?? "user",
    reviewCount,
  };
}

function getAdminUsersClient() {
  const supabaseUrl = normalizeSupabaseProjectUrl(readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const serviceRoleKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Admin users access is not configured.");
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
