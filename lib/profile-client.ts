"use client";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

const avatarBucket = "avatars";
const maxAvatarSize = 5 * 1024 * 1024;
const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  role?: "user" | "admin" | null;
  plan?: "free" | "pro" | null;
  status?: "active" | "disabled" | null;
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
    .select("id, email, display_name, avatar_url, role, plan, status, created_at, updated_at")
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
    .select("id, email, display_name, avatar_url, role, plan, status, created_at, updated_at")
    .single<ProfileRow>();

  if (profileError) {
    if (isMissingUserIdColumnError(profileError)) {
      const { data: legacyProfile, error: legacyProfileError } = await supabase
        .from("profiles")
        .upsert(baseProfilePayload, { onConflict: "id" })
        .select("id, email, display_name, avatar_url, role, plan, status, created_at, updated_at")
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
    .select("id, email, display_name, avatar_url, role, plan, status, created_at, updated_at")
    .single<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return fromRow(data);
}

export async function uploadUserAvatar(file: File) {
  if (!allowedAvatarTypes.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WebP image.");
  }

  if (file.size > maxAvatarSize) {
    throw new Error("Please choose an image smaller than 5MB.");
  }

  const profile = await getCurrentUserProfile();

  if (!profile) {
    throw new Error("Please sign in first.");
  }

  const supabase = getSupabaseClient();
  const extension = getAvatarExtension(file);
  const filePath = `${profile.id}/avatar-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(avatarBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(avatarBucket).getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error("Profile photo uploaded, but the public URL could not be created.");
  }

  return updateUserProfile({
    avatarUrl: data.publicUrl,
    displayName: profile.displayName,
  });
}

function fromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role ?? undefined,
    plan: row.plan ?? undefined,
    status: row.status ?? undefined,
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

function getAvatarExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}
