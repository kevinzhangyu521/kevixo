import { readFileSync } from "node:fs";
import {
  anonymousAnalysisLimit,
  createAnonymousAnalysisIdentity,
} from "../lib/anonymous-analysis-identity";
import {
  beginAnalysisQuota,
  confirmAnalysisQuota,
  releaseAnalysisQuota,
  type AnalysisQuotaStatus,
  type AnalysisQuotaStore,
} from "../lib/analysis-quota";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function cookieValue(setCookie: string) {
  return setCookie.slice(0, setCookie.indexOf(";"));
}

function createStore() {
  const requests = new Map<string, {
    subjectId: string;
    fingerprint: string;
    status: AnalysisQuotaStatus;
    result?: unknown;
  }>();
  let queue = Promise.resolve();

  function locked<T>(operation: () => T | Promise<T>) {
    const result = queue.then(operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }

  const store: AnalysisQuotaStore = {
    reserve: ({ requestId, userId: subjectId, fingerprint, limit, countsTowardQuota }) => locked(() => {
      const existing = requests.get(requestId);
      if (existing) {
        if (existing.subjectId !== subjectId || existing.fingerprint !== fingerprint) {
          throw new Error("Anonymous quota request does not match the original request.");
        }
        if (existing.status === "succeeded") {
          return { allowed: true, status: existing.status, periodStart: "lifetime", result: existing.result };
        }
        if (existing.status === "reserved") {
          return { allowed: false, status: existing.status, periodStart: "lifetime" };
        }
      }

      const used = [...requests.values()].filter((request) =>
        request.subjectId === subjectId && ["reserved", "succeeded"].includes(request.status),
      ).length;
      const status: AnalysisQuotaStatus = !countsTowardQuota || used < limit ? "reserved" : "quota_exceeded";
      requests.set(requestId, { subjectId, fingerprint, status });
      return { allowed: status === "reserved", status, periodStart: "lifetime" };
    }),
    confirm: ({ requestId, fingerprint, result }) => locked(() => {
      const request = requests.get(requestId);
      assert(request?.fingerprint === fingerprint, "Expected the anonymous confirmation fingerprint to match.");
      if (request.status === "reserved") {
        request.status = "succeeded";
        request.result = result;
      }
      return { status: request.status };
    }),
    release: ({ requestId, fingerprint }) => locked(() => {
      const request = requests.get(requestId);
      assert(request?.fingerprint === fingerprint, "Expected the anonymous release fingerprint to match.");
      if (request.status === "reserved") request.status = "failed";
      return { status: request.status };
    }),
  };

  return { requests, store };
}

function testCreatesStableSignedAnonymousIdentity() {
  const secret = "a".repeat(64);
  const visitorId = "11111111-1111-4111-8111-111111111111";
  const first = createAnonymousAnalysisIdentity({ cookieHeader: null, visitorId, secret });
  assert(first.setCookie?.includes("HttpOnly"), "Expected an HttpOnly anonymous analysis cookie.");
  assert(first.setCookie?.includes("Secure"), "Expected a Secure anonymous analysis cookie.");
  assert(first.setCookie?.includes("SameSite=Lax"), "Expected a SameSite anonymous analysis cookie.");
  assert(!first.setCookie?.includes(visitorId), "Expected the cookie not to expose the local visitor ID.");
  assert(/^[0-9a-f]{64}$/.test(first.subjectHash), "Expected only a one-way anonymous subject hash for database storage.");

  const repeated = createAnonymousAnalysisIdentity({
    cookieHeader: cookieValue(first.setCookie ?? ""),
    visitorId: "22222222-2222-4222-8222-222222222222",
    secret,
  });
  assert(repeated.subjectHash === first.subjectHash, "Expected a valid server cookie to remain authoritative.");
  assert(repeated.setCookie === undefined, "Expected a valid cookie not to be rewritten.");

  const cookieCleared = createAnonymousAnalysisIdentity({ cookieHeader: null, visitorId, secret });
  assert(cookieCleared.subjectHash === first.subjectHash, "Expected local visitor continuity to survive cookie-only clearing.");
}

async function testAnonymousFirstAnalysisAndSecondBlock() {
  const { store } = createStore();
  const base = { quotaSubjectId: "anonymous-a", isCoach: false, isDemo: false, isFollowUp: false };
  const first = await beginAnalysisQuota({ ...base, requestId: "first", fingerprint: "hand-one", limit: anonymousAnalysisLimit }, store);
  assert(first.kind === "reserved", "Expected the first real anonymous analysis to reserve.");
  await confirmAnalysisQuota("first", "hand-one", "review-one", { ok: true, report: { reviewId: "review-one" } }, store);
  const second = await beginAnalysisQuota({ ...base, requestId: "second", fingerprint: "hand-two", limit: anonymousAnalysisLimit }, store);
  assert(second.kind === "quota_exceeded", "Expected a second successful anonymous analysis to be blocked.");
}

async function testAnonymousConcurrencyAndDuplicateReplay() {
  const { store, requests } = createStore();
  const base = { quotaSubjectId: "anonymous-b", isCoach: false, isDemo: false, isFollowUp: false, limit: anonymousAnalysisLimit };
  const concurrent = await Promise.all([
    beginAnalysisQuota({ ...base, requestId: "parallel-one", fingerprint: "one" }, store),
    beginAnalysisQuota({ ...base, requestId: "parallel-two", fingerprint: "two" }, store),
  ]);
  assert(concurrent.filter((result) => result.kind === "reserved").length === 1, "Expected one concurrent anonymous reservation.");
  assert(concurrent.filter((result) => result.kind === "quota_exceeded").length === 1, "Expected the other concurrent request to be blocked.");

  const reservedRequestId = requests.get("parallel-one")?.status === "reserved" ? "parallel-one" : "parallel-two";
  const blockedRequestId = reservedRequestId === "parallel-one" ? "parallel-two" : "parallel-one";
  const reservedFingerprint = reservedRequestId === "parallel-one" ? "one" : "two";
  const blockedFingerprint = blockedRequestId === "parallel-one" ? "one" : "two";
  await releaseAnalysisQuota(reservedRequestId, reservedFingerprint, store);
  const retriedAfterRelease = await beginAnalysisQuota({
    ...base,
    requestId: blockedRequestId,
    fingerprint: blockedFingerprint,
  }, store);
  assert(retriedAfterRelease.kind === "reserved", "Expected a previously blocked request to reserve after the competing AI attempt fails.");

  const duplicateStore = createStore().store;
  const duplicate = { ...base, requestId: "same-request", fingerprint: "same-hand" };
  const duplicateResults = await Promise.all([
    beginAnalysisQuota(duplicate, duplicateStore),
    beginAnalysisQuota(duplicate, duplicateStore),
  ]);
  assert(duplicateResults.some((result) => result.kind === "reserved"), "Expected the original duplicate request to reserve.");
  assert(duplicateResults.some((result) => result.kind === "in_progress"), "Expected the concurrent duplicate to stay idempotent.");
  const saved = { ok: true, report: { reviewId: "review-replay" } };
  await confirmAnalysisQuota("same-request", "same-hand", "review-replay", saved, duplicateStore);
  const replay = await beginAnalysisQuota(duplicate, duplicateStore);
  assert(replay.kind === "replayed" && replay.result === saved, "Expected a successful anonymous retry to replay without another AI call.");
}

async function testAnonymousFailureDoesNotConsumeTrial() {
  const { store } = createStore();
  const input = {
    quotaSubjectId: "anonymous-c",
    requestId: "failed-request",
    fingerprint: "failed-hand",
    isCoach: false,
    isDemo: false,
    isFollowUp: false,
    limit: anonymousAnalysisLimit,
  };
  assert((await beginAnalysisQuota(input, store)).kind === "reserved", "Expected the first attempt to reserve.");
  await releaseAnalysisQuota(input.requestId, input.fingerprint, store);
  assert((await beginAnalysisQuota(input, store)).kind === "reserved", "Expected an AI failure retry not to consume the anonymous trial.");
}

function testMigrationAndRouteBoundaries() {
  const sql = readFileSync("supabase/migrations/015_anonymous_analysis_quota.sql", "utf8");
  const route = readFileSync("app/api/analyze/route.ts", "utf8");
  const page = readFileSync("app/review/page.tsx", "utf8");
  const env = readFileSync(".env.example", "utf8");
  assert(/anonymous_analysis_quota_requests/i.test(sql), "Expected a separate anonymous quota table.");
  assert(/anonymous_id_hash text not null/i.test(sql), "Expected only a hashed anonymous identifier in the database.");
  assert(/pg_advisory_xact_lock/i.test(sql), "Expected anonymous reservations to be concurrency safe.");
  assert(/reserve_anonymous_analysis_quota/i.test(sql) && /confirm_anonymous_analysis_quota/i.test(sql) && /release_anonymous_analysis_quota/i.test(sql), "Expected the anonymous lifecycle RPCs.");
  assert(/grant execute[\s\S]*service_role/i.test(sql), "Expected service-role-only RPC execution.");
  assert(/createSupabaseAnonymousAnalysisQuotaStore/.test(route), "Expected the analyze route to use the anonymous quota store.");
  assert(/anonymous_analysis_limit_reached/.test(route), "Expected a distinct anonymous-limit API error code.");
  assert(/Sign up or log in to continue/.test(route), "Expected a clear registration or login prompt.");
  assert(/anonymous_analysis_limit_reached/.test(page) && /href="\/signup"/.test(page) && /href="\/login"/.test(page), "Expected the review page to render signup and login actions.");
  assert(/ANALYSIS_ANONYMOUS_COOKIE_SECRET=/.test(env), "Expected the server-only anonymous cookie secret to be documented.");
  assert(route.indexOf("if (quotaEnabled)") < route.indexOf("createSupabaseAnonymousAnalysisQuotaStore()"), "Expected the disabled flag to avoid anonymous quota RPCs.");
}

async function run() {
  testCreatesStableSignedAnonymousIdentity();
  await testAnonymousFirstAnalysisAndSecondBlock();
  await testAnonymousConcurrencyAndDuplicateReplay();
  await testAnonymousFailureDoesNotConsumeTrial();
  testMigrationAndRouteBoundaries();
  console.log("anonymous analysis quota tests passed");
}

void run();
