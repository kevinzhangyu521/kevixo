import { createClient } from "@supabase/supabase-js";
import type { AnalysisQuotaStatus, AnalysisQuotaStore } from "@/lib/analysis-quota";

export function createSupabaseAnonymousAnalysisQuotaStore(): AnalysisQuotaStore {
  const client = getQuotaAdminClient();

  return {
    reserve: async ({ userId: anonymousIdHash, requestId, fingerprint, limit, countsTowardQuota }) => {
      const { data, error } = await client.rpc("reserve_anonymous_analysis_quota", {
        p_anonymous_id_hash: anonymousIdHash,
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
        p_limit: limit,
        p_counts_toward_quota: countsTowardQuota,
      });
      if (error) throw new Error(error.message);
      return readReserveResult(data);
    },
    confirm: async ({ requestId, fingerprint, reviewId, result }) => {
      const { data, error } = await client.rpc("confirm_anonymous_analysis_quota", {
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
        p_review_id: reviewId,
        p_result_json: result,
      });
      if (error) throw new Error(error.message);
      return readTransitionResult(data);
    },
    release: async ({ requestId, fingerprint }) => {
      const { data, error } = await client.rpc("release_anonymous_analysis_quota", {
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
      });
      if (error) throw new Error(error.message);
      return readTransitionResult(data);
    },
  };
}

function readReserveResult(value: unknown) {
  const row = readFirstRow(value);
  const status = readStatus(row.status);
  const periodStart = typeof row.period_start === "string" ? row.period_start : "";
  if (!periodStart) throw new Error("Anonymous analysis quota reservation returned no scope.");
  return { allowed: row.allowed === true, status, periodStart, result: row.result_json };
}

function readTransitionResult(value: unknown) {
  return { status: readStatus(readFirstRow(value).status) };
}

function readFirstRow(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") throw new Error("Anonymous analysis quota operation returned no result.");
  return row as Record<string, unknown>;
}

function readStatus(value: unknown): AnalysisQuotaStatus {
  if (["reserved", "succeeded", "failed", "expired", "quota_exceeded"].includes(String(value))) {
    return value as AnalysisQuotaStatus;
  }
  throw new Error("Anonymous analysis quota operation returned an unknown status.");
}

function getQuotaAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Anonymous analysis quota is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
