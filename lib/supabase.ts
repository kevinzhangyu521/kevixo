import { createClient } from "@supabase/supabase-js";

const supabaseUrlResult = readSupabaseProjectUrl();
const supabaseUrl = supabaseUrlResult.url;
const supabaseAnonKey = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseConfigurationError() {
  const missingVariables = [
    supabaseUrl ? "" : "NEXT_PUBLIC_SUPABASE_URL",
    supabaseAnonKey ? "" : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (supabaseUrlResult.error) {
    return supabaseUrlResult.error;
  }

  if (missingVariables.length > 0) {
    return `Supabase public config missing: ${missingVariables.join(", ")}.`;
  }

  return undefined;
}

function readSupabaseProjectUrl() {
  try {
    return {
      url: normalizeSupabaseProjectUrl(readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL")),
      error: undefined,
    };
  } catch (error) {
    return {
      url: undefined,
      error: error instanceof Error ? error.message : "Supabase URL is invalid.",
    };
  }
}

function normalizeSupabaseProjectUrl(value: string | undefined) {
  const rawUrl = value?.trim();

  if (!rawUrl) {
    return undefined;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL like https://<project>.supabase.co.",
    );
  }

  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be exactly https://<project>.supabase.co.",
    );
  }

  return parsedUrl.origin;
}

function readRuntimeEnv(name: string) {
  return process.env[name]?.trim();
}
