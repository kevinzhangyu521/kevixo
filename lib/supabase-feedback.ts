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
  review_id: string | null;
  email: string | null;
  source_page: string;
};

export type ReviewFeedbackListResult = {
  feedback: ReviewFeedbackEntry[];
  total: number;
};

const tableName = "review_feedback";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
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

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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
  const supabase = getFeedbackAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .update({ status: "resolved" })
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
    review_id: entry.reviewId ?? null,
    email: entry.email ?? null,
    source_page: entry.sourcePage ?? "/review",
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
    reviewId: row.review_id ?? undefined,
    email: row.email ?? undefined,
    sourcePage: row.source_page,
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
      `review_id.ilike.${pattern}`,
      `email.ilike.${pattern}`,
      `source_page.ilike.${pattern}`,
      `status.ilike.${pattern}`,
    ].join(","),
  );
}
