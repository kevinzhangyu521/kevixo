import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isReviewFeedbackEntry,
  type ReviewFeedbackEntry,
  type ReviewFeedbackStatus,
} from "@/lib/review-feedback";

type ReviewFeedbackRow = {
  id: string;
  created_at: string;
  status: ReviewFeedbackStatus;
  useful_part: string;
  message: string;
  improvement: string;
  grade: string;
  browser: string | null;
  user_agent: string | null;
  review_id: string | null;
  email: string | null;
  source_page: string;
  admin_note: string | null;
};

export type ReviewFeedbackListResult = {
  feedback: ReviewFeedbackEntry[];
  total: number;
};

const tableName = "review_feedback";

function getSupabaseUrl() {
  return normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function getFeedbackInsertClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  logSupabaseRequestUrl("feedback:insert", supabaseUrl);

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

function getFeedbackAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  logSupabaseRequestUrl("feedback:admin", supabaseUrl);

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

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL like https://<project>.supabase.co.",
    );
  }

  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be exactly https://<project>.supabase.co.",
    );
  }

  if (parsedUrl.pathname !== "/" && process.env.NODE_ENV !== "production") {
    console.warn(
      `[Kevixo Supabase] NEXT_PUBLIC_SUPABASE_URL contains a path (${parsedUrl.pathname}). Using ${parsedUrl.origin}.`,
    );
  }

  return parsedUrl.origin;
}

function logSupabaseRequestUrl(operation: string, supabaseUrl: string) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info(
    `[Kevixo Supabase] ${operation} request URL: ${new URL(`/rest/v1/${tableName}`, supabaseUrl).toString()}`,
  );
}

export async function insertReviewFeedback(entry: ReviewFeedbackEntry) {
  const normalizedEntry = normalizeFeedbackEntry(entry);
  const supabase = getFeedbackInsertClient();
  const { data, error } = await supabase
    .from(tableName)
    .insert(toRow(normalizedEntry))
    .select()
    .single<ReviewFeedbackRow>();

  if (error) {
    throw new Error(error.message);
  }

  return fromRow(data);
}

export async function listReviewFeedback({
  page,
  pageSize,
  query,
  status,
}: {
  page: number;
  pageSize: number;
  query: string;
  status: "all" | ReviewFeedbackStatus;
}): Promise<ReviewFeedbackListResult> {
  const supabase = getFeedbackAdminClient();
  let request = supabase
    .from(tableName)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status !== "all") {
    request = request.eq("status", status);
  }

  if (query) {
    request = applySearch(request, query);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await request.range(from, to).returns<ReviewFeedbackRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    feedback: (data ?? []).map(fromRow),
    total: count ?? 0,
  };
}

export async function resolveReviewFeedback(id: string) {
  return updateReviewFeedback(id, { status: "resolved" });
}

export async function updateReviewFeedback(
  id: string,
  updates: {
    status?: ReviewFeedbackStatus;
    adminNote?: string;
  },
) {
  const supabase = getFeedbackAdminClient();
  const updatePayload: {
    status?: ReviewFeedbackStatus;
    admin_note?: string;
  } = {};

  if (updates.status) {
    updatePayload.status = updates.status;
  }

  if (typeof updates.adminNote === "string") {
    updatePayload.admin_note = updates.adminNote.slice(0, 500);
  }

  const { data, error } = await supabase
    .from(tableName)
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single<ReviewFeedbackRow>();

  if (error) {
    throw new Error(error.message);
  }

  return fromRow(data);
}

export async function deleteReviewFeedbackFromSupabase(id: string) {
  const supabase = getFeedbackAdminClient();
  const { error } = await supabase.from(tableName).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeFeedbackEntry(entry: ReviewFeedbackEntry) {
  if (!isReviewFeedbackEntry(entry)) {
    throw new Error("Invalid feedback payload.");
  }

  return entry;
}

function toRow(entry: ReviewFeedbackEntry) {
  return {
    id: entry.id,
    created_at: entry.createdAt,
    status: entry.status,
    useful_part: entry.usefulPart,
    message: entry.message,
    improvement: entry.improvement,
    grade: entry.grade,
    browser: entry.browser ?? null,
    user_agent: entry.userAgent ?? entry.browser ?? null,
    review_id: entry.reviewId ?? null,
    email: entry.email ?? null,
    source_page: entry.sourcePage ?? "/review",
    admin_note: entry.adminNote ?? null,
  };
}

function fromRow(row: ReviewFeedbackRow): ReviewFeedbackEntry {
  return {
    id: row.id,
    date: row.created_at,
    createdAt: row.created_at,
    status: row.status,
    usefulPart: row.useful_part as ReviewFeedbackEntry["usefulPart"],
    message: row.message,
    improvement: row.improvement,
    grade: row.grade,
    browser: row.browser ?? undefined,
    userAgent: row.user_agent ?? undefined,
    reviewId: row.review_id ?? undefined,
    email: row.email ?? undefined,
    sourcePage: row.source_page,
    adminNote: row.admin_note ?? undefined,
  };
}

function applySearch(
  request: ReturnType<SupabaseClient["from"]> extends infer Builder
    ? Builder extends { select: (...args: never[]) => infer Selected }
      ? Selected
      : never
    : never,
  query: string,
) {
  const escapedQuery = query.replace(/[%_,]/g, "\\$&");
  const pattern = `%${escapedQuery}%`;

  return request.or(
    [
      `message.ilike.${pattern}`,
      `improvement.ilike.${pattern}`,
      `useful_part.ilike.${pattern}`,
      `grade.ilike.${pattern}`,
      `browser.ilike.${pattern}`,
      `user_agent.ilike.${pattern}`,
      `review_id.ilike.${pattern}`,
      `email.ilike.${pattern}`,
      `source_page.ilike.${pattern}`,
      `admin_note.ilike.${pattern}`,
      `status.ilike.${pattern}`,
    ].join(","),
  );
}
