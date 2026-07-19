"use client";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserProfile() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  await ensureUserProfile();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, created_at, updated_at")
    .eq("id", userData.user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromRow(data) : null;
}

export async function ensureUserProfile() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const now = new Date().toISOString();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        email: data.user.email ?? "",
        updated_at: now,
      },
      { onConflict: "id" },
    )
    .select("id, email, display_name, avatar_url, created_at, updated_at")
    .single<ProfileRow>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return fromRow(profile);
}

export async function updateUserProfile({
  avatarUrl,
  displayName,
}: {
  avatarUrl?: string;
  displayName?: string;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    throw new Error("Please sign in first.");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName?.trim() || null,
      avatar_url: avatarUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("id, email, display_name, avatar_url, created_at, updated_at")
    .single<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return fromRow(data);
}

function fromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
