import { createClient } from "@supabase/supabase-js";

export type GrowthEventType =
  | "review_started"
  | "review_completed"
  | "share_clicked"
  | "copy_link_clicked"
  | "image_downloaded";

const growthEventsTable = "growth_events";
const emailCapturesTable = "email_captures";

export async function insertGrowthEvent({
  eventType,
  reviewId,
  visitorId,
  sourcePage,
  userAgent,
}: {
  eventType: GrowthEventType;
  reviewId?: string;
  visitorId?: string;
  sourcePage?: string;
  userAgent?: string;
}) {
  const supabase = getServerClient();

  const { error } = await supabase.from(growthEventsTable).insert({
    event_type: eventType,
    review_id: reviewId ?? null,
    visitor_id: visitorId ?? null,
    source_page: sourcePage ?? "/review",
    user_agent: userAgent ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function insertEmailCapture({
  email,
  reviewId,
  visitorId,
  sourcePage,
  userAgent,
}: {
  email: string;
  reviewId?: string;
  visitorId?: string;
  sourcePage?: string;
  userAgent?: string;
}) {
  const supabase = getServerClient();

  const { error } = await supabase.from(emailCapturesTable).insert({
    email,
    review_id: reviewId ?? null,
    visitor_id: visitorId ?? null,
    source_page: sourcePage ?? "/review",
    user_agent: userAgent ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function getServerClient() {
  const supabaseUrl = normalizeSupabaseProjectUrl(readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const supabaseKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY") ?? readRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Growth tracking is not configured.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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
