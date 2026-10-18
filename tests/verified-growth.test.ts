import { buildVerifiedExternalGrowthMetrics, fetchAllDashboardPages } from "../lib/admin-dashboard";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const range = {
  start: new Date("2026-09-01T00:00:00.000Z"),
  end: new Date("2026-10-01T00:00:00.000Z"),
};

const metrics = buildVerifiedExternalGrowthMetrics({
  range,
  profiles: [
    { user_id: "external-one", is_test_account: false, role: "user", created_at: "2026-08-28T12:00:00.000Z" },
    { user_id: "external-two", is_test_account: false, role: "user", created_at: "2026-09-15T12:00:00.000Z" },
    { user_id: "founder-test", is_test_account: true, role: "user", created_at: "2026-09-10T12:00:00.000Z" },
    { user_id: "admin-user", is_test_account: false, role: "admin", created_at: "2026-09-11T12:00:00.000Z" },
  ],
  reviews: [
    { user_id: "external-one", created_at: "2026-08-31T23:59:59.000Z" },
    { user_id: "external-one", created_at: "2026-09-01T00:00:00.000Z" },
    { user_id: "external-two", created_at: "2026-09-15T12:00:00.000Z" },
    { user_id: "external-two", created_at: "2026-10-01T00:00:00.000Z" },
    { user_id: "founder-test", created_at: "2026-09-10T12:00:00.000Z" },
    { user_id: "admin-user", created_at: "2026-09-11T12:00:00.000Z" },
    { user_id: "missing-profile", created_at: "2026-09-12T12:00:00.000Z" },
    { user_id: null, created_at: "2026-09-12T12:00:00.000Z" },
  ],
  events: [
    { user_id: "external-one", visitor_id: "visitor-external", created_at: "2026-09-30T12:00:00.000Z", event_type: "review_viewed" },
    { user_id: "external-one", visitor_id: "visitor-external-second", created_at: "2026-09-30T13:00:00.000Z", event_type: "review_started" },
    { user_id: "founder-test", visitor_id: "visitor-test", created_at: "2026-09-30T12:00:00.000Z", event_type: "review_viewed" },
    { user_id: "admin-user", visitor_id: "visitor-admin", created_at: "2026-09-30T12:00:00.000Z", event_type: "review_viewed" },
    { user_id: "missing-profile", visitor_id: "visitor-unknown", created_at: "2026-09-30T12:00:00.000Z", event_type: "review_viewed" },
    { user_id: null, visitor_id: "visitor-anonymous", created_at: "2026-09-30T12:00:00.000Z", event_type: "review_viewed" },
    { user_id: null, visitor_id: null, created_at: "2026-09-30T12:00:00.000Z", event_type: "review_viewed" },
  ],
});

assert(metrics.registeredUsers === 1, "Expected only external profiles created inside the selected range.");
assert(metrics.firstReviewUsers === 1, "Expected the first saved external review inside the selected range to count once.");
assert(metrics.secondReviewUsers === 1, "Expected a cross-month second saved external review to count in range.");
assert(metrics.recentlyActiveUsers === 1, "Expected only recent authenticated external product activity to count.");
assert(metrics.anonymousReviewRecords === 1, "Expected anonymous saved reviews to remain separate.");
assert(metrics.anonymousVisitors === 1, "Expected anonymous visitor IDs to remain separate.");
assert(metrics.unknownReviewRecords === 1, "Expected reviews without a reliable profile to remain unknown.");
assert(metrics.unknownEvents === 2, "Expected unlinked authenticated and visitor-less events to remain unknown.");
assert(metrics.internalReviewRecords === 2, "Expected test and admin reviews to remain outside external metrics.");
assert(metrics.internalEvents === 2, "Expected test and admin events to remain outside external metrics.");

async function testReadsEveryDashboardPage() {
  const requestedOffsets: number[] = [];
  const rows = await fetchAllDashboardPages(
    async (from, to) => {
      requestedOffsets.push(from, to);
      const all = ["one", "two", "three", "four", "five"];
      return { data: all.slice(from, to + 1), error: null };
    },
    2,
  );

  assert(rows.join(",") === "one,two,three,four,five", "Expected every page to be included.");
  assert(requestedOffsets.join(",") === "0,1,2,3,4,5", "Expected pagination to advance without overlap.");
}

async function testFailsWhenAPageFails() {
  let didFail = false;

  try {
    await fetchAllDashboardPages(async () => ({ data: null, error: { message: "read failed" } }), 2);
  } catch (error) {
    didFail = error instanceof Error && error.message === "read failed";
  }

  assert(didFail, "Expected a failed page read to reject instead of returning partial metrics.");
}

async function run() {
  await testReadsEveryDashboardPage();
  await testFailsWhenAPageFails();
  console.log("verified growth tests passed");
}

void run();
