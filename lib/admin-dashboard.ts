import { createClient } from "@supabase/supabase-js";

type FeedbackStatus = "open" | "resolved";
type UsefulPart = "Biggest Mistake" | "Better Decision" | "Coach Note" | "Homework" | "Other";
type BrowserName = "Chrome" | "Safari" | "Edge" | "Firefox" | "Other";
type DeviceName = "Desktop" | "Mobile" | "Tablet";
type GradeBucket = "A" | "B" | "C" | "D";
type GrowthEventRow = {
  created_at: string;
  event_type: string;
  review_id: string | null;
  visitor_id: string | null;
  user_id: string | null;
  user_agent: string | null;
};

type ProfileDashboardRow = {
  user_id: string;
  is_test_account: boolean;
  role: "user" | "admin" | null;
  created_at: string;
};

export type DashboardDateRange = {
  start: Date;
  end: Date;
};

type SubscriptionDashboardRow = {
  created_at: string;
  updated_at: string;
  status: string;
  plan: string;
  current_period_end: string | null;
};

type ReviewDashboardRow = {
  created_at: string;
  review_id: string;
  grade: string | null;
  confidence: number | null;
  user_agent: string | null;
  user_id: string | null;
};

type FeedbackDashboardRow = {
  created_at: string;
  status: FeedbackStatus;
  useful_part: UsefulPart | string;
  review_id: string | null;
  user_agent: string | null;
  browser: string | null;
};

export type FounderDashboardData = {
  range: { start: string; end: string };
  verifiedUsers: {
    registeredUsers: number;
    firstReviewUsers: number;
    secondReviewUsers: number;
    recentlyActiveUsers: number;
  };
  anonymousActivity: { anonymousReviewRecords: number; anonymousVisitors: number };
  unknownActivity: { unknownReviewRecords: number; unknownEvents: number };
  internalActivity: { internalReviewRecords: number; internalEvents: number };
  ga4: { status: "not_connected"; sessions: null; activeUsers: null; engagedSessions: null };
  overview: {
    reviewsStarted: number;
    reviewsCompleted: number;
    reviewsToday: number;
    reviewsThisWeek: number;
    feedbackToday: number;
    openFeedback: number;
    resolvedFeedback: number;
    feedbackRate: number;
    shareRate: number;
    emailsCollected: number;
    returningVisitors: number;
    returningUsers: number;
    reviewsPerUser: number;
    averageReviewsPerPlayer: number;
    weeklyActivePlayers: number;
    weeklyReturningPlayers: number;
    averageReviewsPerActivePlayer: number;
    dailyChallengeAttempts: number;
    dailyChallengeCompletionRate: number;
    averageStreak: number;
    averageGrade: string;
    averageConfidence: number;
  };
  revenue: {
    activeSubscribers: number;
    mrr: number;
    newSubscribers: number;
    cancelledSubscribers: number;
  };
  usefulParts: Array<{
    label: UsefulPart;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    type: "New Review" | "New Feedback" | "Feedback Resolved";
    time: string;
    reviewId?: string;
    status: string;
  }>;
  browserBreakdown: Array<{
    label: BrowserName;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    label: DeviceName;
    count: number;
    percentage: number;
  }>;
  gradeDistribution: Array<{
    label: GradeBucket;
    count: number;
    percentage: number;
  }>;
};

const feedbackTable = "review_feedback";
const reviewTable = "hand_reviews";
const growthEventsTable = "growth_events";
const emailCapturesTable = "email_captures";
const subscriptionsTable = "subscriptions";
const coachMonthlyPrice = 9.99;
const usefulPartLabels: UsefulPart[] = [
  "Biggest Mistake",
  "Better Decision",
  "Coach Note",
  "Homework",
  "Other",
];
const browserLabels: BrowserName[] = ["Chrome", "Safari", "Edge", "Firefox", "Other"];
const deviceLabels: DeviceName[] = ["Desktop", "Mobile", "Tablet"];
const gradeLabels: GradeBucket[] = ["A", "B", "C", "D"];

export async function getFounderDashboardData(
  range = getLastThirtyDayRange(new Date()),
): Promise<FounderDashboardData> {
  const supabase = getAdminClient();
  const rangeEndAnchor = new Date(range.end.getTime() - 1);
  const todayStart = startOfUtcDay(rangeEndAnchor).toISOString();
  const weekStart = startOfUtcWeek(rangeEndAnchor).toISOString();

  const [
    allReviewsBeforeRangeEnd,
    emailsCollected,
    feedbackRows,
    growthRows,
    subscriptionRows,
    profileRows,
  ] = await Promise.all([
    listDashboardReviews(supabase, { before: range.end }),
    countRows(supabase, emailCapturesTable, range),
    listDashboardFeedback(supabase, range),
    listGrowthEvents(supabase, range),
    listSubscriptions(supabase),
    listDashboardProfiles(supabase),
  ]);
  const reviewRows = filterRowsInRange(allReviewsBeforeRangeEnd, range);
  const verifiedUsers = buildVerifiedExternalGrowthMetrics({
    range,
    profiles: profileRows,
    reviews: allReviewsBeforeRangeEnd,
    events: growthRows,
  });
  const totalReviews = reviewRows.length;
  const reviewsToday = reviewRows.filter((row) => row.created_at >= todayStart).length;
  const reviewsThisWeek = reviewRows.filter((row) => row.created_at >= weekStart).length;
  const feedbackToday = feedbackRows.filter((row) => row.created_at >= todayStart).length;
  const openFeedback = feedbackRows.filter((row) => row.status === "open").length;
  const resolvedFeedback = feedbackRows.filter((row) => row.status === "resolved").length;
  const totalFeedback = feedbackRows.length;

  const averageConfidence = average(
    reviewRows
      .map((review) => review.confidence)
      .filter((value): value is number => typeof value === "number"),
  );
  const gradeDistribution = buildGradeDistribution(reviewRows);
  const usefulParts = buildUsefulPartBreakdown(feedbackRows);
  const browserBreakdown = buildBrowserBreakdown([...reviewRows, ...feedbackRows]);
  const deviceBreakdown = buildDeviceBreakdown([...reviewRows, ...feedbackRows]);
  const returningUsers = countReturningUsers(growthRows);
  const reviewsPerUser = reviewsPerVisitor(growthRows, "review_started");
  const averageReviewsPerPlayer = reviewsPerVisitor(growthRows, "review_completed");
  const weeklyGrowthRows = growthRows.filter((row) => new Date(row.created_at) >= new Date(weekStart));
  const weeklyActivePlayers = countActivePlayers(weeklyGrowthRows);
  const dailyChallengeAttempts = growthRows.filter(
    (row) => row.event_type === "daily_challenge_attempted",
  ).length;
  const dailyChallengeCompletions = growthRows.filter(
    (row) => row.event_type === "daily_challenge_completed",
  );

  return {
    range: { start: range.start.toISOString(), end: range.end.toISOString() },
    verifiedUsers: {
      registeredUsers: verifiedUsers.registeredUsers,
      firstReviewUsers: verifiedUsers.firstReviewUsers,
      secondReviewUsers: verifiedUsers.secondReviewUsers,
      recentlyActiveUsers: verifiedUsers.recentlyActiveUsers,
    },
    anonymousActivity: { anonymousReviewRecords: verifiedUsers.anonymousReviewRecords, anonymousVisitors: verifiedUsers.anonymousVisitors },
    unknownActivity: {
      unknownReviewRecords: verifiedUsers.unknownReviewRecords,
      unknownEvents: verifiedUsers.unknownEvents,
    },
    internalActivity: {
      internalReviewRecords: verifiedUsers.internalReviewRecords,
      internalEvents: verifiedUsers.internalEvents,
    },
    ga4: { status: "not_connected", sessions: null, activeUsers: null, engagedSessions: null },
    overview: {
      reviewsStarted: growthRows.filter((row) => row.event_type === "review_started").length,
      reviewsCompleted: totalReviews,
      reviewsToday,
      reviewsThisWeek,
      feedbackToday,
      openFeedback,
      resolvedFeedback,
      feedbackRate: percentage(totalFeedback, totalReviews),
      shareRate: percentage(
        growthRows.filter((row) => row.event_type === "share_clicked").length,
        totalReviews,
      ),
      emailsCollected,
      returningVisitors: countReturningVisitors(growthRows),
      returningUsers,
      reviewsPerUser,
      averageReviewsPerPlayer,
      weeklyActivePlayers,
      weeklyReturningPlayers: countReturningUsers(weeklyGrowthRows),
      averageReviewsPerActivePlayer: reviewsPerActivePlayer(weeklyGrowthRows, weeklyActivePlayers),
      dailyChallengeAttempts,
      dailyChallengeCompletionRate: percentage(dailyChallengeCompletions.length, dailyChallengeAttempts),
      averageStreak: averageDailyChallengeStreak(dailyChallengeCompletions, rangeEndAnchor),
      averageGrade: averageGrade(reviewRows),
      averageConfidence: Math.round(averageConfidence),
    },
    revenue: buildRevenueMetrics(subscriptionRows, range.start.toISOString()),
    usefulParts,
    recentActivity: buildRecentActivity(reviewRows, feedbackRows),
    browserBreakdown,
    deviceBreakdown,
    gradeDistribution,
  };
}

function getAdminClient() {
  const supabaseUrl = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin dashboard access is not configured.");
  }

  return createClient(normalizeSupabaseProjectUrl(supabaseUrl), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function countRows(
  supabase: ReturnType<typeof getAdminClient>,
  table: string,
  range?: DashboardDateRange,
) {
  let request = supabase.from(table).select("id", { count: "exact", head: true });

  if (range) {
    request = request
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString());
  }

  const { count, error } = await request;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function listDashboardReviews(
  supabase: ReturnType<typeof getAdminClient>,
  filters: { before: Date },
) {
  return fetchAllDashboardPages<ReviewDashboardRow>((from, to) =>
    supabase
      .from(reviewTable)
      .select("created_at, review_id, grade, confidence, user_agent, user_id")
      .lt("created_at", filters.before.toISOString())
      .order("created_at", { ascending: true })
      .order("review_id", { ascending: true })
      .range(from, to)
      .returns<ReviewDashboardRow[]>(),
  );
}

async function listDashboardFeedback(
  supabase: ReturnType<typeof getAdminClient>,
  range: DashboardDateRange,
) {
  return fetchAllDashboardPages<FeedbackDashboardRow>((from, to) =>
    supabase
      .from(feedbackTable)
      .select("created_at, status, useful_part, review_id, user_agent, browser")
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString())
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
      .returns<FeedbackDashboardRow[]>(),
  );
}

async function listGrowthEvents(
  supabase: ReturnType<typeof getAdminClient>,
  range: DashboardDateRange,
) {
  return fetchAllDashboardPages<GrowthEventRow>((from, to) =>
    supabase
      .from(growthEventsTable)
      .select("created_at, event_type, review_id, visitor_id, user_id, user_agent")
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString())
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
      .returns<GrowthEventRow[]>(),
  );
}

async function listDashboardProfiles(supabase: ReturnType<typeof getAdminClient>) {
  return fetchAllDashboardPages<ProfileDashboardRow>((from, to) =>
    supabase
      .from("profiles")
      .select("user_id, is_test_account, role, created_at")
      .order("created_at", { ascending: true })
      .order("user_id", { ascending: true })
      .range(from, to)
      .returns<ProfileDashboardRow[]>(),
  );
}

export async function fetchAllDashboardPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  pageSize = 1_000,
) {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }
  }
}

export function buildVerifiedExternalGrowthMetrics({
  events,
  range,
  profiles,
  reviews,
}: {
  range: DashboardDateRange;
  profiles: Array<Pick<ProfileDashboardRow, "user_id" | "is_test_account" | "role" | "created_at">>;
  reviews: Array<Pick<ReviewDashboardRow, "created_at" | "user_id">>;
  events: Array<Pick<GrowthEventRow, "created_at" | "event_type" | "user_id" | "visitor_id">>;
}) {
  const profilesByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));
  const externalUserIds = new Set(
    profiles
      .filter((profile) => !profile.is_test_account && profile.role !== "admin")
      .map((profile) => profile.user_id),
  );
  const anonymousVisitors = new Set<string>();
  const recentlyActiveUsers = new Set<string>();
  const reviewsByExternalUser = new Map<string, Array<Pick<ReviewDashboardRow, "created_at" | "user_id">>>();
  const activeWindowStart = new Date(Math.max(range.start.getTime(), range.end.getTime() - 7 * 24 * 60 * 60 * 1000));
  let anonymousReviewRecords = 0;
  let unknownReviewRecords = 0;
  let internalReviewRecords = 0;
  let unknownEvents = 0;
  let internalEvents = 0;

  for (const review of reviews) {
    if (!isInRange(review.created_at, range)) {
      continue;
    }

    if (!review.user_id) {
      anonymousReviewRecords += 1;
      continue;
    }

    if (externalUserIds.has(review.user_id)) continue;

    if (profilesByUserId.has(review.user_id)) {
      internalReviewRecords += 1;
    } else {
      unknownReviewRecords += 1;
    }
  }

  for (const review of reviews) {
    if (!review.user_id || !externalUserIds.has(review.user_id) || new Date(review.created_at) >= range.end) {
      continue;
    }

    const userReviews = reviewsByExternalUser.get(review.user_id) ?? [];
    userReviews.push(review);
    reviewsByExternalUser.set(review.user_id, userReviews);
  }

  const firstReviewUsers = new Set<string>();
  const secondReviewUsers = new Set<string>();

  for (const [userId, userReviews] of reviewsByExternalUser) {
    userReviews.sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
    if (userReviews[0] && isInRange(userReviews[0].created_at, range)) firstReviewUsers.add(userId);
    if (userReviews[1] && isInRange(userReviews[1].created_at, range)) secondReviewUsers.add(userId);
  }

  for (const event of events) {
    if (!isInRange(event.created_at, range)) {
      continue;
    }

    if (!event.user_id) {
      if (event.visitor_id) {
        anonymousVisitors.add(event.visitor_id);
      } else {
        unknownEvents += 1;
      }
      continue;
    }

    if (externalUserIds.has(event.user_id)) {
      if (isProductActivityEvent(event.event_type) && new Date(event.created_at) >= activeWindowStart) {
        recentlyActiveUsers.add(event.user_id);
      }
      continue;
    }

    if (profilesByUserId.has(event.user_id)) {
      internalEvents += 1;
    } else {
      unknownEvents += 1;
    }
  }

  return {
    registeredUsers: profiles.filter(
      (profile) => externalUserIds.has(profile.user_id) && isInRange(profile.created_at, range),
    ).length,
    firstReviewUsers: firstReviewUsers.size,
    secondReviewUsers: secondReviewUsers.size,
    recentlyActiveUsers: recentlyActiveUsers.size,
    anonymousReviewRecords,
    anonymousVisitors: anonymousVisitors.size,
    unknownReviewRecords,
    unknownEvents,
    internalReviewRecords,
    internalEvents,
  };
}

async function listSubscriptions(supabase: ReturnType<typeof getAdminClient>) {
  return fetchAllDashboardPages<SubscriptionDashboardRow>((from, to) =>
    supabase
      .from(subscriptionsTable)
      .select("created_at, updated_at, status, plan, current_period_end")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
      .returns<SubscriptionDashboardRow[]>(),
  );
}

function buildRevenueMetrics(rows: SubscriptionDashboardRow[], todayStart: string) {
  const now = Date.now();
  const activeRows = rows.filter((row) => {
    if (row.plan !== "coach" || !["active", "trialing"].includes(row.status)) {
      return false;
    }

    if (!row.current_period_end) {
      return true;
    }

    return new Date(row.current_period_end).getTime() > now;
  });

  return {
    activeSubscribers: activeRows.length,
    mrr: Math.round(activeRows.length * coachMonthlyPrice * 100) / 100,
    newSubscribers: rows.filter((row) => row.created_at >= todayStart && row.plan === "coach").length,
    cancelledSubscribers: rows.filter((row) => row.updated_at >= todayStart && row.status === "canceled").length,
  };
}

function buildUsefulPartBreakdown(rows: FeedbackDashboardRow[]) {
  const counts = new Map<UsefulPart, number>(usefulPartLabels.map((label) => [label, 0]));

  rows.forEach((row) => {
    const label = usefulPartLabels.includes(row.useful_part as UsefulPart)
      ? (row.useful_part as UsefulPart)
      : "Other";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return usefulPartLabels.map((label) => {
    const count = counts.get(label) ?? 0;

    return {
      label,
      count,
      percentage: percentage(count, rows.length),
    };
  });
}

function buildRecentActivity(
  reviews: ReviewDashboardRow[],
  feedback: FeedbackDashboardRow[],
): FounderDashboardData["recentActivity"] {
  return [
    ...reviews.slice(0, 10).map((review) => ({
      type: "New Review" as const,
      time: review.created_at,
      reviewId: review.review_id,
      status: review.grade ?? "Review saved",
    })),
    ...feedback.slice(0, 10).map((entry) => ({
      type: entry.status === "resolved" ? ("Feedback Resolved" as const) : ("New Feedback" as const),
      time: entry.created_at,
      reviewId: entry.review_id ?? undefined,
      status: entry.status,
    })),
  ]
    .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
    .slice(0, 10);
}

function buildBrowserBreakdown(rows: Array<{ user_agent?: string | null; browser?: string | null }>) {
  const counts = new Map<BrowserName, number>(browserLabels.map((label) => [label, 0]));

  rows.forEach((row) => {
    const label = detectBrowser(row.user_agent ?? row.browser ?? "");
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return browserLabels.map((label) => {
    const count = counts.get(label) ?? 0;

    return {
      label,
      count,
      percentage: percentage(count, rows.length),
    };
  });
}

function buildDeviceBreakdown(rows: Array<{ user_agent?: string | null; browser?: string | null }>) {
  const counts = new Map<DeviceName, number>(deviceLabels.map((label) => [label, 0]));

  rows.forEach((row) => {
    const label = detectDevice(row.user_agent ?? row.browser ?? "");
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return deviceLabels.map((label) => {
    const count = counts.get(label) ?? 0;

    return {
      label,
      count,
      percentage: percentage(count, rows.length),
    };
  });
}

function buildGradeDistribution(rows: ReviewDashboardRow[]) {
  const counts = new Map<GradeBucket, number>(gradeLabels.map((label) => [label, 0]));

  rows.forEach((row) => {
    const bucket = gradeBucket(row.grade);

    if (bucket) {
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
  });

  return gradeLabels.map((label) => {
    const count = counts.get(label) ?? 0;

    return {
      label,
      count,
      percentage: percentage(count, rows.length),
    };
  });
}

function averageGrade(rows: ReviewDashboardRow[]) {
  const scores = rows
    .map((row) => gradeScore(row.grade))
    .filter((value): value is number => typeof value === "number");

  if (scores.length === 0) {
    return "N/A";
  }

  const value = average(scores);

  if (value >= 3.5) {
    return "A";
  }

  if (value >= 2.5) {
    return "B";
  }

  if (value >= 1.5) {
    return "C";
  }

  return "D";
}

function gradeScore(grade: string | null) {
  const bucket = gradeBucket(grade);

  if (!bucket) {
    return undefined;
  }

  return { A: 4, B: 3, C: 2, D: 1 }[bucket];
}

function gradeBucket(grade: string | null): GradeBucket | undefined {
  const firstLetter = grade?.trim().charAt(0).toUpperCase();

  return gradeLabels.includes(firstLetter as GradeBucket)
    ? (firstLetter as GradeBucket)
    : undefined;
}

function detectBrowser(userAgent: string): BrowserName {
  const value = userAgent.toLowerCase();

  if (value.includes("edg/")) {
    return "Edge";
  }

  if (value.includes("firefox/")) {
    return "Firefox";
  }

  if (value.includes("chrome/") || value.includes("crios/")) {
    return "Chrome";
  }

  if (value.includes("safari/")) {
    return "Safari";
  }

  return "Other";
}

function detectDevice(userAgent: string): DeviceName {
  const value = userAgent.toLowerCase();

  if (value.includes("ipad") || value.includes("tablet")) {
    return "Tablet";
  }

  if (value.includes("mobi") || value.includes("iphone") || value.includes("android")) {
    return "Mobile";
  }

  return "Desktop";
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countReturningVisitors(rows: GrowthEventRow[]) {
  const visitorCounts = new Map<string, number>();

  rows.forEach((row) => {
    if (!row.visitor_id) {
      return;
    }

    visitorCounts.set(row.visitor_id, (visitorCounts.get(row.visitor_id) ?? 0) + 1);
  });

  return Array.from(visitorCounts.values()).filter((count) => count > 1).length;
}

function countReturningUsers(rows: GrowthEventRow[]) {
  const completedReviewCounts = new Map<string, number>();

  rows.forEach((row) => {
    if (!row.visitor_id || row.event_type !== "review_completed") {
      return;
    }

    completedReviewCounts.set(row.visitor_id, (completedReviewCounts.get(row.visitor_id) ?? 0) + 1);
  });

  return Array.from(completedReviewCounts.values()).filter((count) => count > 1).length;
}

function reviewsPerVisitor(rows: GrowthEventRow[], eventType: "review_started" | "review_completed") {
  const visitorIds = new Set<string>();
  let reviewCount = 0;

  rows.forEach((row) => {
    if (!row.visitor_id || row.event_type !== eventType) {
      return;
    }

    visitorIds.add(row.visitor_id);
    reviewCount += 1;
  });

  if (visitorIds.size === 0) {
    return 0;
  }

  return Math.round((reviewCount / visitorIds.size) * 10) / 10;
}

function countActivePlayers(rows: GrowthEventRow[]) {
  const visitorIds = new Set<string>();

  rows.forEach((row) => {
    if (
      row.visitor_id &&
      (row.event_type === "review_started" || row.event_type === "review_completed")
    ) {
      visitorIds.add(row.visitor_id);
    }
  });

  return visitorIds.size;
}

function reviewsPerActivePlayer(rows: GrowthEventRow[], activePlayers: number) {
  if (activePlayers === 0) {
    return 0;
  }

  const completedReviews = rows.filter((row) => row.event_type === "review_completed").length;
  return Math.round((completedReviews / activePlayers) * 10) / 10;
}

function averageDailyChallengeStreak(rows: GrowthEventRow[], now: Date) {
  const daysByVisitor = new Map<string, Set<string>>();

  rows.forEach((row) => {
    if (!row.visitor_id) {
      return;
    }

    const dateKey = row.created_at.slice(0, 10);
    const days = daysByVisitor.get(row.visitor_id) ?? new Set<string>();
    days.add(dateKey);
    daysByVisitor.set(row.visitor_id, days);
  });

  const streaks = Array.from(daysByVisitor.values()).map((days) =>
    currentDailyStreak(Array.from(days), getUtcDateKey(now)),
  );

  if (streaks.length === 0) {
    return 0;
  }

  return Math.round(average(streaks) * 10) / 10;
}

function currentDailyStreak(completedDays: string[], todayKey: string) {
  const completed = new Set(completedDays);
  const utcDayInMs = 24 * 60 * 60 * 1000;
  let cursor = new Date(`${todayKey}T00:00:00.000Z`);
  let streak = 0;

  while (completed.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - utcDayInMs);
  }

  return streak;
}

export function getLastThirtyDayRange(now: Date): DashboardDateRange {
  const end = startOfUtcDay(new Date(now));
  end.setUTCDate(end.getUTCDate() + 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  return { start, end };
}

export function getPreviousThirtyDayRange(now: Date): DashboardDateRange {
  const current = getLastThirtyDayRange(now);
  const end = new Date(current.start);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  return { start, end };
}

export function createUtcDateRange(startDate: string, endDate: string): DashboardDateRange | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return null;
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (
    start.toISOString().slice(0, 10) !== startDate ||
    end.toISOString().slice(0, 10) !== endDate
  ) {
    return null;
  }

  end.setUTCDate(end.getUTCDate() + 1);

  if (start >= end) {
    return null;
  }

  return { start, end };
}

function isInRange(value: string, range: DashboardDateRange) {
  const timestamp = new Date(value).getTime();
  return timestamp >= range.start.getTime() && timestamp < range.end.getTime();
}

function isProductActivityEvent(eventType: string) {
  return [
    "review_viewed",
    "review_started",
    "analyze_succeeded",
    "analyze_failed",
    "review_persisted",
    "review_persist_failed",
    "review_completed",
    "daily_challenge_attempted",
    "daily_challenge_completed",
  ].includes(eventType);
}

function filterRowsInRange<T extends { created_at: string }>(rows: T[], range: DashboardDateRange) {
  return rows.filter((row) => isInRange(row.created_at, range));
}

function getUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function percentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date) {
  const start = startOfUtcDay(date);
  const day = start.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
}

function readRuntimeEnv(name: string) {
  return process.env[name]?.trim();
}

function normalizeSupabaseProjectUrl(value: string) {
  const parsedUrl = new URL(value);

  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be exactly https://<project>.supabase.co.");
  }

  return parsedUrl.origin;
}
