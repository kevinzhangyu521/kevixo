"use client";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export async function getCurrentAccessToken() {
  if (!isSupabaseConfigured) {
    return undefined;
  }

  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token;
}

export async function getCurrentUserId() {
  if (!isSupabaseConfigured) {
    return undefined;
  }

  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();

  return data.user?.id;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getCurrentAccessToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}
