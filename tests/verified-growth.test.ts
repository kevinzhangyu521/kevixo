import { buildVerifiedExternalGrowthMetrics } from "../lib/admin-dashboard";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-10-01T00:00:00.000Z");
const metrics = buildVerifiedExternalGrowthMetrics({
  now,
  profiles: [
    { user_id: "external-one", is_test_account: false },
    { user_id: "external-two", is_test_account: false },
    { user_id: "founder-test", is_test_account: true },
  ],
  reviews: [
    { user_id: "external-one" },
    { user_id: "external-one" },
    { user_id: "founder-test" },
    { user_id: null },
  ],
  events: [
    { user_id: "external-two", visitor_id: "visitor-external", created_at: "2026-09-30T12:00:00.000Z" },
    { user_id: "founder-test", visitor_id: "visitor-test", created_at: "2026-09-30T12:00:00.000Z" },
    { user_id: null, visitor_id: "visitor-anonymous", created_at: "2026-09-30T12:00:00.000Z" },
    { user_id: "external-one", visitor_id: "visitor-old", created_at: "2026-09-20T12:00:00.000Z" },
  ],
});

assert(metrics.registeredUsers === 2, "Expected test accounts to be excluded from registrations.");
assert(metrics.firstReviewUsers === 1, "Expected one verified external user with a saved review.");
assert(metrics.repeatReviewUsers === 1, "Expected one verified external user with at least two saved reviews.");
assert(metrics.recentlyActiveUsers === 1, "Expected recent activity to use verified user IDs only.");
assert(metrics.anonymousReviewRecords === 1, "Expected anonymous reviews to remain separate.");
assert(metrics.anonymousVisitors === 1, "Expected anonymous visitors to remain separate.");

console.log("verified growth tests passed");
