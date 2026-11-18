import { readFileSync } from "fs";
import {
  beginAnalysisQuota,
  confirmAnalysisQuota,
  createAnalysisInputFingerprint,
  isAnalysisQuotaEnabled,
  releaseAnalysisQuota,
  type AnalysisQuotaStore,
  type AnalysisQuotaStatus,
} from "../lib/analysis-quota";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createStore(limit = 10, now = () => new Date("2026-11-17T10:00:00.000Z")) {
  const requests = new Map<string, {
    userId: string;
    fingerprint: string;
    period: string;
    status: AnalysisQuotaStatus;
    countsTowardQuota: boolean;
    expiresAt: number;
    result?: unknown;
  }>();
  let queue = Promise.resolve();

  function locked<T>(operation: () => T | Promise<T>) {
    const result = queue.then(operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }

  const store: AnalysisQuotaStore = {
    reserve: ({ requestId, userId, fingerprint, countsTowardQuota }) => locked(() => {
      const instant = now();
      const period = `${instant.getUTCFullYear()}-${String(instant.getUTCMonth() + 1).padStart(2, "0")}-01`;
      const existing = requests.get(requestId);
      if (existing) {
        if (existing.userId !== userId || existing.fingerprint !== fingerprint) {
          throw new Error("Analysis quota request does not match the original input.");
        }
        if (existing.status === "succeeded") {
          return { allowed: true, status: existing.status, periodStart: existing.period, result: existing.result };
        }
        if (existing.status === "reserved" && existing.expiresAt > instant.getTime()) {
          return { allowed: false, status: existing.status, periodStart: existing.period };
        }
        if (existing.status === "quota_exceeded" && existing.period === period) {
          return { allowed: false, status: existing.status, periodStart: existing.period };
        }
        existing.status = "expired";
      }

      for (const request of requests.values()) {
        if (request.status === "reserved" && request.expiresAt <= instant.getTime()) request.status = "expired";
      }

      const used = [...requests.values()].filter((request) => request.userId === userId && request.period === period && request.countsTowardQuota && (request.status === "reserved" || request.status === "succeeded")).length;
      const status: AnalysisQuotaStatus = !countsTowardQuota || used < limit ? "reserved" : "quota_exceeded";
      requests.set(requestId, { userId, fingerprint, period, status, countsTowardQuota, expiresAt: instant.getTime() + 15 * 60 * 1000 });
      return { allowed: status === "reserved", status, periodStart: period };
    }),
    confirm: ({ requestId, fingerprint, reviewId, result }) => locked(() => {
      assert(Boolean(reviewId), "Expected confirmation to carry the successful report review ID.");
      const request = requests.get(requestId);
      assert(request?.fingerprint === fingerprint, "Expected confirmation fingerprint to match.");
      if (request.status === "reserved") {
        request.status = "succeeded";
        request.result = result;
      }
      return { status: request?.status ?? "failed" };
    }),
    release: ({ requestId, fingerprint }) => locked(() => {
      const request = requests.get(requestId);
      assert(request?.fingerprint === fingerprint, "Expected release fingerprint to match.");
      if (request.status === "reserved") request.status = "failed";
      return { status: request?.status ?? "failed" };
    }),
  };

  return { store, requests };
}

async function testBypassesAnonymousDemoFollowUpAndCoach() {
  const calls: string[] = [];
  const store: AnalysisQuotaStore = {
    reserve: async () => { calls.push("reserve"); throw new Error("should not reserve"); },
    confirm: async () => ({ status: "succeeded" }),
    release: async () => ({ status: "failed" }),
  };
  const cases = [
    { userId: undefined, isCoach: false, isDemo: false, isFollowUp: false },
    { userId: "user-a", isCoach: false, isDemo: true, isFollowUp: false },
    { userId: "user-a", isCoach: false, isDemo: false, isFollowUp: true },
  ];
  for (const item of cases) {
    const result = await beginAnalysisQuota({ ...item, requestId: crypto.randomUUID(), fingerprint: "fingerprint" }, store);
    assert(result.kind === "bypassed", "Expected non-metered analysis to bypass quota.");
  }
  assert(calls.length === 0, "Expected bypassed analyses not to reserve quota.");
}

async function testCoachUsesIdempotencyWithoutConsumingQuota() {
  const { store } = createStore(1);
  const results = await Promise.all(Array.from({ length: 12 }, (_, index) => beginAnalysisQuota({
    userId: "coach-user",
    requestId: `coach-${index}`,
    fingerprint: `coach-fingerprint-${index}`,
    isCoach: true,
    isDemo: false,
    isFollowUp: false,
  }, store)));
  assert(results.every((result) => result.kind === "reserved"), "Expected Coach analyses to remain unlimited.");
}

async function testConcurrentReservationsCannotExceedLimit() {
  const { store } = createStore(10);
  const results = await Promise.all(Array.from({ length: 11 }, (_, index) => beginAnalysisQuota({
    userId: "user-a", requestId: `request-${index}`, fingerprint: `fingerprint-${index}`, isCoach: false, isDemo: false, isFollowUp: false,
  }, store)));
  assert(results.filter((result) => result.kind === "reserved").length === 10, "Expected exactly ten reservations.");
  assert(results.filter((result) => result.kind === "quota_exceeded").length === 1, "Expected the concurrent eleventh request to be rejected.");
}

async function testDuplicateRequestDoesNotConsumeTwice() {
  const { store, requests } = createStore();
  const input = { userId: "user-a", requestId: "same-request", fingerprint: "same-hand", isCoach: false, isDemo: false, isFollowUp: false };
  const duplicateResults = await Promise.all([beginAnalysisQuota(input, store), beginAnalysisQuota(input, store)]);
  assert(duplicateResults.filter((result) => result.kind === "reserved").length === 1, "Expected only the first duplicate to run AI.");
  assert(duplicateResults.filter((result) => result.kind === "in_progress").length === 1, "Expected the concurrent duplicate to wait for replay.");
  assert(requests.size === 1, "Expected one quota record for a retried request ID.");

  const result = { ok: true, report: { reviewId: "review-123" } };
  await confirmAnalysisQuota(input.requestId, input.fingerprint, "review-123", result, store);
  const replay = await beginAnalysisQuota(input, store);
  assert(replay.kind === "replayed", "Expected a successful retry to replay the saved result.");
  if (replay.kind === "replayed") assert(replay.result === result, "Expected the original successful result.");

  let mismatched = false;
  try {
    await beginAnalysisQuota({ ...input, fingerprint: "different-hand" }, store);
  } catch {
    mismatched = true;
  }
  assert(mismatched, "Expected a request ID to stay bound to one normalized hand.");
}

async function testFailureReleaseAndPersistenceFailureSemantics() {
  const { store, requests } = createStore();
  const input = { userId: "user-a", requestId: "analysis-failed", fingerprint: "failed-hand", isCoach: false, isDemo: false, isFollowUp: false };
  await beginAnalysisQuota(input, store);
  await releaseAnalysisQuota(input.requestId, input.fingerprint, store);
  assert(requests.get(input.requestId)?.status === "failed", "Expected AI failure to release the reservation.");
  assert((await beginAnalysisQuota(input, store)).kind === "reserved", "Expected a failed logical request to reserve again.");

  const succeeded = { ...input, requestId: "report-succeeded" };
  await beginAnalysisQuota(succeeded, store);
  await confirmAnalysisQuota(succeeded.requestId, succeeded.fingerprint, "review-123", { ok: true }, store);
  assert(requests.get(succeeded.requestId)?.status === "succeeded", "Expected report success to count even if later Review persistence fails.");
}

async function testUtcMonthSwitchAndExpiredReservationRelease() {
  let current = new Date("2026-11-30T23:59:59.000Z");
  const { store, requests } = createStore(1, () => current);
  await beginAnalysisQuota({ userId: "user-a", requestId: "november", fingerprint: "november-hand", isCoach: false, isDemo: false, isFollowUp: false }, store);
  current = new Date("2026-12-01T00:00:00.000Z");
  const december = await beginAnalysisQuota({ userId: "user-a", requestId: "december", fingerprint: "december-hand", isCoach: false, isDemo: false, isFollowUp: false }, store);
  assert(december.kind === "reserved", "Expected a new UTC month to receive a fresh quota.");

  current = new Date("2026-12-01T00:16:00.000Z");
  const replacement = await beginAnalysisQuota({ userId: "user-a", requestId: "replacement", fingerprint: "replacement-hand", isCoach: false, isDemo: false, isFollowUp: false }, store);
  assert(requests.get("december")?.status === "expired", "Expected stale reservation to expire safely.");
  assert(replacement.kind === "reserved", "Expected an expired reservation to release capacity.");
}

async function testOnlyQuotaExceededIsReportedAsExhausted() {
  for (const status of ["failed", "expired"] as const) {
    const store: AnalysisQuotaStore = {
      reserve: async () => ({ allowed: false, status, periodStart: "2026-11-01" }),
      confirm: async () => ({ status: "succeeded" }),
      release: async () => ({ status: "failed" }),
    };
    let rejected = false;
    try {
      await beginAnalysisQuota({ userId: "user-a", requestId: status, fingerprint: status, isCoach: false, isDemo: false, isFollowUp: false }, store);
    } catch {
      rejected = true;
    }
    assert(rejected, `Expected ${status} not to be reported as quota exceeded.`);
  }

  const quotaStore: AnalysisQuotaStore = {
    reserve: async () => ({ allowed: false, status: "quota_exceeded", periodStart: "2026-11-01" }),
    confirm: async () => ({ status: "succeeded" }),
    release: async () => ({ status: "failed" }),
  };
  const result = await beginAnalysisQuota({ userId: "user-a", requestId: "quota", fingerprint: "quota", isCoach: false, isDemo: false, isFollowUp: false }, quotaStore);
  assert(result.kind === "quota_exceeded", "Expected only quota_exceeded to map to exhausted quota.");
}

function testMigrationDefinesAtomicLifecycle() {
  const sql = readFileSync("supabase/migrations/014_analysis_monthly_quota.sql", "utf8");
  const route = readFileSync("app/api/analyze/route.ts", "utf8");
  const page = readFileSync("app/review/page.tsx", "utf8");
  const envExample = readFileSync(".env.example", "utf8");
  assert(/pg_advisory_xact_lock/i.test(sql), "Expected reservation to use a transaction-scoped user-period lock.");
  assert(/reserve_analysis_quota/i.test(sql), "Expected an atomic reserve function.");
  assert(/confirm_analysis_quota/i.test(sql), "Expected a success confirmation function.");
  assert(/release_analysis_quota/i.test(sql), "Expected a failure release function.");
  assert(/expire_analysis_quota_reservations/i.test(sql), "Expected an explicit stale reservation cleanup function.");
  assert(/date_trunc\('month', timezone\('UTC', now\(\)\)\)/i.test(sql), "Expected UTC calendar month periods.");
  assert(/request_fingerprint text not null/i.test(sql), "Expected request IDs to bind to normalized input.");
  assert(/result_json jsonb/i.test(sql), "Expected successful results to be stored for replay.");
  assert(
    (sql.match(/perform pg_advisory_xact_lock[\s\S]*?for update/gi) ?? []).length >= 3,
    "Expected reserve, confirm, and release to take the advisory lock before row locks.",
  );
  assert(createAnalysisInputFingerprint("hand one") === createAnalysisInputFingerprint("hand one"), "Expected stable fingerprints.");
  assert(createAnalysisInputFingerprint("hand one") !== createAnalysisInputFingerprint("hand two"), "Expected different hands to differ.");
  assert(/beginAnalysisQuota/.test(route) && /confirmAnalysisQuota/.test(route) && /releaseAnalysisQuota/.test(route), "Expected the analyze route to use the quota lifecycle.");
  assert(route.indexOf("reservation = await beginAnalysisQuota") < route.indexOf("const result = await analyzeHandHistory"), "Expected reservation before AI analysis.");
  assert(route.indexOf("const confirmation = await confirmAnalysisQuota") < route.indexOf("await insertHandReview"), "Expected confirmation before Review persistence.");
  assert(/free_monthly_analysis_limit_reached/.test(route), "Expected Free quota exhaustion to return a distinct user-visible error code.");
  assert(/free_monthly_analysis_limit_reached/.test(page), "Expected Review to render a dedicated Free quota exhaustion state.");
  assert(/reset at the start of the next UTC month/.test(page), "Expected the Free quota state to explain the UTC reset accurately.");
  assert(/Upgrade to Coach/.test(page) && /No monthly product analysis quota/.test(page), "Expected the Free quota state to describe the implemented Coach exemption without promising premium features.");
  assert(/crypto\.randomUUID\(\)/.test(page) && /requestId/.test(page), "Expected the client to send stable request IDs.");
  assert(/ANALYSIS_QUOTA_ENABLED=false/.test(envExample), "Expected analysis quota to default off.");
  assert(/const quotaEnabled = isAnalysisQuotaEnabled\(process\.env\.ANALYSIS_QUOTA_ENABLED\)/.test(route), "Expected the route to use the private quota gate.");
  assert(route.indexOf("if (quotaEnabled)") < route.indexOf("createSupabaseAnalysisQuotaStore()"), "Expected the closed gate to avoid constructing the quota database client.");
  assert(route.indexOf("const result = await analyzeHandHistory") < route.indexOf("[Kevixo review persistence auth lookup failed]"), "Expected the closed path to retain post-analysis auth lookup.");
}

function testQuotaFeatureFlagDefaultsClosed() {
  for (const value of [undefined, "", "false", "TRUE", "1", " true "]) {
    assert(!isAnalysisQuotaEnabled(value), `Expected ${String(value)} not to enable analysis quota.`);
  }
  assert(isAnalysisQuotaEnabled("true"), "Expected exact true to enable analysis quota.");
}

async function run() {
  await testBypassesAnonymousDemoFollowUpAndCoach();
  await testCoachUsesIdempotencyWithoutConsumingQuota();
  await testConcurrentReservationsCannotExceedLimit();
  await testDuplicateRequestDoesNotConsumeTwice();
  await testFailureReleaseAndPersistenceFailureSemantics();
  await testUtcMonthSwitchAndExpiredReservationRelease();
  await testOnlyQuotaExceededIsReportedAsExhausted();
  testQuotaFeatureFlagDefaultsClosed();
  testMigrationDefinesAtomicLifecycle();
  console.log("analysis quota tests passed");
}

void run();
