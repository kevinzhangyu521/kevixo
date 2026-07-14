import { createClient } from "@supabase/supabase-js";

export type KevixoUser = {
  id: string;
  email?: string;
};

export async function getUserFromRequest(request: Request): Promise<KevixoUser | null> {
  const token = readBearerToken(request);

  if (!token) {
    return null;
  }

  const supabaseUrl = normalizeSupabaseProjectUrl(readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const supabaseAnonKey = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
}

export function getSiteUrl() {
  return (
    readRuntimeEnv("NEXT_PUBLIC_SITE_URL") ??
    readRuntimeEnv("VERCEL_PROJECT_PRODUCTION_URL")?.replace(/^/, "https://") ??
    "https://www.kevixo.com"
  ).replace(/\/$/, "");
}

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }

  return header.slice("bearer ".length).trim();
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
