import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrlResult = readSupabaseProjectUrl();
const supabaseUrl = supabaseUrlResult.url;
const supabaseAnonKey = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
let browserClient: SupabaseClient | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  browserClient ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storageKey: "kevixo-auth-session",
    },
  });

  return browserClient;
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
  if (name === "NEXT_PUBLIC_SUPABASE_URL") {
    return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  }

  if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  }

  return undefined;
}
