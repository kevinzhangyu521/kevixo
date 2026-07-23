"use client";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role?: "user" | "admin";
  plan?: "free" | "pro";
  status?: "active" | "disabled";
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

  try {
    await ensureUserProfile();
  } catch (error) {
    throw new Error("Account setup failed. Please try again.", { cause: error });
  }

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
  const baseProfilePayload = {
    id: data.user.id,
    email: data.user.email ?? "",
    updated_at: now,
  };
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        ...baseProfilePayload,
        user_id: data.user.id,
      },
      { onConflict: "id" },
    )
    .select("id, email, display_name, avatar_url, created_at, updated_at")
    .single<ProfileRow>();

  if (profileError) {
    if (isMissingUserIdColumnError(profileError)) {
      const { data: legacyProfile, error: legacyProfileError } = await supabase
        .from("profiles")
        .upsert(baseProfilePayload, { onConflict: "id" })
        .select("id, email, display_name, avatar_url, created_at, updated_at")
        .single<ProfileRow>();

      if (legacyProfileError) {
        throw new Error("Account setup failed. Please try again.", {
          cause: legacyProfileError,
        });
      }

      return fromRow(legacyProfile);
    }

    throw new Error("Account setup failed. Please try again.", { cause: profileError });
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

function isMissingUserIdColumnError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    message.includes("user_id") && message.includes("column")
  );
}
