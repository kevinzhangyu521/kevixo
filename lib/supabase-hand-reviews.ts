import { createClient } from "@supabase/supabase-js";
import type { CoachingReport } from "@/services/ai";

type HandReviewRow = {
  id: string;
  review_id: string;
  created_at: string;
  hand_history: string;
  review_json: CoachingReport;
  grade: string | null;
  confidence: number | null;
  difficulty: string | null;
  source_page: string;
  user_agent: string | null;
  ai_version: string;
};

export type PersistedHandReview = {
  id: string;
  reviewId: string;
  createdAt: string;
  handHistory: string;
  report: CoachingReport;
  sourcePage: string;
  userAgent?: string;
  aiVersion: string;
};

const tableName = "hand_reviews";

export async function insertHandReview({
  handHistory,
  report,
  userAgent,
}: {
  handHistory: string;
  report: CoachingReport;
  userAgent?: string;
}) {
  const supabase = getHandReviewServerClient();
  const payload = {
    review_id: report.reviewId,
    hand_history: handHistory,
    review_json: report,
    grade: report.grade,
    confidence: Math.round(report.confidence),
    difficulty: String(report.difficulty),
    source_page: "/review",
    user_agent: userAgent ?? null,
    ai_version: "v1",
  };

  logHandReviewInsertPayload(payload);

  const { data, error } = await supabase
    .from(tableName)
    .insert(payload)
    .select()
    .single<HandReviewRow>();

  if (error) {
    console.error("[Kevixo hand review insert failed]", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message);
  }

  return fromRow(data);
}

export async function findHandReviewByReviewId(reviewId: string) {
  const supabase = getHandReviewAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("review_id", reviewId)
    .maybeSingle<HandReviewRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromRow(data) : null;
}

function getHandReviewServerClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseServiceRoleKey() ?? getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase hand review insert is not configured.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getHandReviewAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase hand review admin access is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function fromRow(row: HandReviewRow): PersistedHandReview {
  return {
    id: row.id,
    reviewId: row.review_id,
    createdAt: row.created_at,
    handHistory: row.hand_history,
    report: row.review_json,
    sourcePage: row.source_page,
    userAgent: row.user_agent ?? undefined,
    aiVersion: row.ai_version,
  };
}

function getSupabaseUrl() {
  return normalizeSupabaseProjectUrl(readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL"));
}

function getSupabaseAnonKey() {
  return readRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

function getSupabaseServiceRoleKey() {
  return readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");
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

function logHandReviewInsertPayload(payload: {
  review_id: string;
  hand_history: string;
  review_json: CoachingReport;
  grade: string;
  confidence: number;
  difficulty: string;
  source_page: string;
  user_agent: string | null;
  ai_version: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info("[Kevixo hand review insert payload]", {
    ...payload,
    hand_history: `${payload.hand_history.slice(0, 120)}...`,
  });
}
