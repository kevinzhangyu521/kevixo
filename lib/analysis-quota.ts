import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const freeMonthlyAnalysisLimit = 10;

export function isAnalysisQuotaEnabled(value: string | undefined) {
  return value === "true";
}

export type AnalysisQuotaStatus =
  | "reserved"
  | "succeeded"
  | "failed"
  | "expired"
  | "quota_exceeded";

type ReserveResult = {
  allowed: boolean;
  status: AnalysisQuotaStatus;
  periodStart: string;
  result?: unknown;
};

type TransitionResult = { status: AnalysisQuotaStatus };

export type AnalysisQuotaStore = {
  reserve: (input: { userId: string; requestId: string; fingerprint: string; limit: number; countsTowardQuota: boolean }) => Promise<ReserveResult>;
  confirm: (input: { requestId: string; fingerprint: string; reviewId: string; result: unknown }) => Promise<TransitionResult>;
  release: (input: { requestId: string; fingerprint: string }) => Promise<TransitionResult>;
};

export type BeginAnalysisQuotaInput = {
  userId?: string;
  quotaSubjectId?: string;
  requestId: string;
  fingerprint: string;
  isCoach: boolean;
  isDemo: boolean;
  isFollowUp: boolean;
  limit?: number;
};

export type BeginAnalysisQuotaResult =
  | { kind: "bypassed"; reason: "anonymous" | "coach" | "demo" | "follow_up" }
  | { kind: "reserved"; periodStart: string }
  | { kind: "in_progress"; periodStart: string }
  | { kind: "replayed"; periodStart: string; result: unknown }
  | { kind: "quota_exceeded"; periodStart: string };

export async function beginAnalysisQuota(
  input: BeginAnalysisQuotaInput,
  store: AnalysisQuotaStore,
): Promise<BeginAnalysisQuotaResult> {
  const quotaSubjectId = input.quotaSubjectId ?? input.userId;
  if (!quotaSubjectId) return { kind: "bypassed", reason: "anonymous" };
  if (input.isDemo) return { kind: "bypassed", reason: "demo" };
  if (input.isFollowUp) return { kind: "bypassed", reason: "follow_up" };

  const reservation = await store.reserve({
    userId: quotaSubjectId,
    requestId: input.requestId,
    fingerprint: input.fingerprint,
    limit: input.limit ?? freeMonthlyAnalysisLimit,
    countsTowardQuota: !input.isCoach,
  });

  if (reservation.status === "quota_exceeded") {
    return { kind: "quota_exceeded", periodStart: reservation.periodStart };
  }

  if (reservation.status === "succeeded") {
    if (reservation.result == null) throw new Error("Successful analysis quota request returned no replay result.");
    return { kind: "replayed", periodStart: reservation.periodStart, result: reservation.result };
  }

  if (reservation.status === "reserved" && !reservation.allowed) {
    return { kind: "in_progress", periodStart: reservation.periodStart };
  }

  if (!reservation.allowed || reservation.status !== "reserved") {
    throw new Error(`Analysis quota request could not be reserved (${reservation.status}).`);
  }

  return { kind: "reserved", periodStart: reservation.periodStart };
}

export function confirmAnalysisQuota(requestId: string, fingerprint: string, reviewId: string, result: unknown, store: AnalysisQuotaStore) {
  return store.confirm({ requestId, fingerprint, reviewId, result });
}

export function releaseAnalysisQuota(requestId: string, fingerprint: string, store: AnalysisQuotaStore) {
  return store.release({ requestId, fingerprint });
}

export function createAnalysisInputFingerprint(normalizedHandHistory: string) {
  return createHash("sha256").update(normalizedHandHistory, "utf8").digest("hex");
}

export function createSupabaseAnalysisQuotaStore(): AnalysisQuotaStore {
  const client = getQuotaAdminClient();

  return {
    reserve: async ({ userId, requestId, fingerprint, limit, countsTowardQuota }) => {
      const { data, error } = await client.rpc("reserve_analysis_quota", {
        p_user_id: userId,
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
        p_limit: limit,
        p_counts_toward_quota: countsTowardQuota,
      });
      if (error) throw new Error(error.message);
      return readReserveResult(data);
    },
    confirm: async ({ requestId, fingerprint, reviewId, result }) => {
      const { data, error } = await client.rpc("confirm_analysis_quota", {
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
        p_review_id: reviewId,
        p_result_json: result,
      });
      if (error) throw new Error(error.message);
      return readTransitionResult(data);
    },
    release: async ({ requestId, fingerprint }) => {
      const { data, error } = await client.rpc("release_analysis_quota", {
        p_request_id: requestId,
        p_request_fingerprint: fingerprint,
      });
      if (error) throw new Error(error.message);
      return readTransitionResult(data);
    },
  };
}

function readReserveResult(value: unknown): ReserveResult {
  const row = readFirstRow(value);
  const status = readStatus(row.status);
  const periodStart = typeof row.period_start === "string" ? row.period_start : "";
  if (!periodStart) throw new Error("Analysis quota reservation returned no period.");
  return { allowed: row.allowed === true, status, periodStart, result: row.result_json };
}

function readTransitionResult(value: unknown): TransitionResult {
  const row = readFirstRow(value);
  return { status: readStatus(row.status) };
}

function readFirstRow(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") throw new Error("Analysis quota operation returned no result.");
  return row as Record<string, unknown>;
}

function readStatus(value: unknown): AnalysisQuotaStatus {
  if (["reserved", "succeeded", "failed", "expired", "quota_exceeded"].includes(String(value))) {
    return value as AnalysisQuotaStatus;
  }
  throw new Error("Analysis quota operation returned an unknown status.");
}

function getQuotaAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Analysis quota is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
