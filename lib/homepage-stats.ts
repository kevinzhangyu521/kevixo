import { createClient } from "@supabase/supabase-js";

const reviewTable = "hand_reviews";

export type HomepageStats = {
  reviewsCompleted: number | null;
  reviewsToday: number | null;
  averageConfidence: number | null;
  supportedPlatforms: number;
};

export const supportedPokerSites = [
  "PokerStars",
  "GGPoker",
  "WPT Global",
  "ACR Poker",
  "888Poker",
  "Winamax",
  "CoinPoker",
];

export async function getHomepageStats(): Promise<HomepageStats> {
  try {
    const supabase = getAdminClient();
    const todayStart = startOfUtcDay(new Date()).toISOString();
    const [reviewsCompleted, reviewsToday, confidenceRows] = await Promise.all([
      countRows(supabase),
      countRows(supabase, todayStart),
      listConfidenceRows(supabase),
    ]);

    return {
      reviewsCompleted,
      reviewsToday,
      averageConfidence: averageConfidence(confidenceRows),
      supportedPlatforms: supportedPokerSites.length,
    };
  } catch (error) {
    console.info("[Kevixo homepage stats unavailable]", error);

    return {
      reviewsCompleted: null,
      reviewsToday: null,
      averageConfidence: null,
      supportedPlatforms: supportedPokerSites.length,
    };
  }
}

function getAdminClient() {
  const supabaseUrl = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Homepage stats are not configured.");
  }

  return createClient(normalizeSupabaseProjectUrl(supabaseUrl), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function countRows(supabase: ReturnType<typeof getAdminClient>, createdAfter?: string) {
  let request = supabase.from(reviewTable).select("id", { count: "exact", head: true });

  if (createdAfter) {
    request = request.gte("created_at", createdAfter);
  }

  const { count, error } = await request;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function listConfidenceRows(supabase: ReturnType<typeof getAdminClient>) {
  const { data, error } = await supabase
    .from(reviewTable)
    .select("confidence")
    .not("confidence", "is", null)
    .limit(500)
    .returns<Array<{ confidence: number | null }>>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function averageConfidence(rows: Array<{ confidence: number | null }>) {
  const values = rows
    .map((row) => row.confidence)
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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
