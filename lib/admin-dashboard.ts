import { createClient } from "@supabase/supabase-js";

type FeedbackStatus = "open" | "resolved";
type UsefulPart = "Biggest Mistake" | "Better Decision" | "Coach Note" | "Homework" | "Other";
type BrowserName = "Chrome" | "Safari" | "Edge" | "Firefox" | "Other";
type DeviceName = "Desktop" | "Mobile" | "Tablet";
type GradeBucket = "A" | "B" | "C" | "D";

type ReviewDashboardRow = {
  created_at: string;
  review_id: string;
  grade: string | null;
  confidence: number | null;
  user_agent: string | null;
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
  overview: {
    reviewsToday: number;
    reviewsThisWeek: number;
    feedbackToday: number;
    openFeedback: number;
    resolvedFeedback: number;
    feedbackRate: number;
    averageGrade: string;
    averageConfidence: number;
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

export async function getFounderDashboardData(): Promise<FounderDashboardData> {
  const supabase = getAdminClient();
  const now = new Date();
  const todayStart = startOfUtcDay(now).toISOString();
  const weekStart = startOfUtcWeek(now).toISOString();

  const [
    reviewsToday,
    reviewsThisWeek,
    totalReviews,
    feedbackToday,
    openFeedback,
    resolvedFeedback,
    totalFeedback,
    reviewRows,
    feedbackRows,
  ] = await Promise.all([
    countRows(supabase, reviewTable, { createdAfter: todayStart }),
    countRows(supabase, reviewTable, { createdAfter: weekStart }),
    countRows(supabase, reviewTable),
    countRows(supabase, feedbackTable, { createdAfter: todayStart }),
    countRows(supabase, feedbackTable, { status: "open" }),
    countRows(supabase, feedbackTable, { status: "resolved" }),
    countRows(supabase, feedbackTable),
    listDashboardReviews(supabase),
    listDashboardFeedback(supabase),
  ]);

  const averageConfidence = average(
    reviewRows
      .map((review) => review.confidence)
      .filter((value): value is number => typeof value === "number"),
  );
  const gradeDistribution = buildGradeDistribution(reviewRows);
  const usefulParts = buildUsefulPartBreakdown(feedbackRows);
  const browserBreakdown = buildBrowserBreakdown([...reviewRows, ...feedbackRows]);
  const deviceBreakdown = buildDeviceBreakdown([...reviewRows, ...feedbackRows]);

  return {
    overview: {
      reviewsToday,
      reviewsThisWeek,
      feedbackToday,
      openFeedback,
      resolvedFeedback,
      feedbackRate: percentage(totalFeedback, totalReviews),
      averageGrade: averageGrade(reviewRows),
      averageConfidence: Math.round(averageConfidence),
    },
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
  filters: { createdAfter?: string; status?: FeedbackStatus } = {},
) {
  let request = supabase.from(table).select("id", { count: "exact", head: true });

  if (filters.createdAfter) {
    request = request.gte("created_at", filters.createdAfter);
  }

  if (filters.status) {
    request = request.eq("status", filters.status);
  }

  const { count, error } = await request;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function listDashboardReviews(supabase: ReturnType<typeof getAdminClient>) {
  const { data, error } = await supabase
    .from(reviewTable)
    .select("created_at, review_id, grade, confidence, user_agent")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<ReviewDashboardRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function listDashboardFeedback(supabase: ReturnType<typeof getAdminClient>) {
  const { data, error } = await supabase
    .from(feedbackTable)
    .select("created_at, status, useful_part, review_id, user_agent, browser")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<FeedbackDashboardRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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
