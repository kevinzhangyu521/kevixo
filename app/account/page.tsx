"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";
import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  type UserProfile,
} from "@/lib/profile-client";
import {
  getSupabaseClient,
  getSupabaseConfigurationError,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { Subscription } from "@/lib/subscription";

type AccountReviewsResponse = {
  ok: boolean;
  reviews?: Array<{
    createdAt: string;
    created_at?: string;
  }>;
  error?: string;
};

type ReviewHistorySummary = {
  totalReviews: number;
  latestReviewAt?: string;
  isLoading: boolean;
};

export default function AccountPage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [status, setStatus] = useState("Loading your account...");
  const [reviewHistory, setReviewHistory] = useState<ReviewHistorySummary>({
    totalReviews: 0,
    isLoading: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus(getSupabaseConfigurationError() ?? "Supabase public config is not available.");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/login?redirect=/account");
        return;
      }

      setAuthEmail(userData.user.email ?? "");

      const nextProfile = await getCurrentUserProfile();

      if (!nextProfile) {
        router.push("/login?redirect=/account");
        return;
      }

      setProfile(nextProfile);
      setDisplayName(nextProfile.displayName ?? "");

      const response = await fetch("/api/billing/subscription", {
        headers: await getAuthHeaders(),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        subscription?: Subscription;
        isCoach?: boolean;
        error?: string;
      };

      if (response.ok && payload.ok && payload.subscription) {
        setSubscription(payload.subscription);
        setIsCoach(Boolean(payload.isCoach));
      }

      const reviewsResponse = await fetch("/api/reviews", {
        headers: await getAuthHeaders(),
      });
      const reviewsPayload = (await reviewsResponse.json()) as AccountReviewsResponse;

      if (reviewsResponse.ok && reviewsPayload.ok) {
        const reviews = reviewsPayload.reviews ?? [];
        setReviewHistory({
          totalReviews: reviews.length,
          latestReviewAt: reviews[0]?.createdAt ?? reviews[0]?.created_at,
          isLoading: false,
        });
      } else {
        setReviewHistory({
          totalReviews: 0,
          isLoading: false,
        });
      }

      setStatus("Account ready.");
    } catch (error) {
      setReviewHistory((current) => ({ ...current, isLoading: false }));
      setStatus(error instanceof Error ? error.message : "Account could not be loaded.");
    }
  }, [router]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadAccount();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadAccount]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("Saving profile...");

    try {
      const nextProfile = await updateUserProfile({
        avatarUrl: profile?.avatarUrl,
        displayName,
      });
      setProfile(nextProfile);
      setDisplayName(nextProfile.displayName ?? "");
      setStatus("Profile updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    setStatus("Uploading...");

    try {
      const nextProfile = await uploadUserAvatar(file);
      setProfile(nextProfile);
      setDisplayName(nextProfile.displayName ?? "");
      setStatus("Profile photo updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile photo could not be uploaded.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handleLogout() {
    if (!isSupabaseConfigured) {
      return;
    }

    await getSupabaseClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze Free" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Your Kevixo account
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Keep your coaching history, profile, and future subscription in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/review">Review a Hand</Link>
            </Button>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5 md:p-6">
            <CardTitle>Profile Information</CardTitle>
            <div className="mt-6 grid gap-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Profile Photo
                </p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <AvatarPreview profile={profile} />
                  <div className="grid gap-2">
                    <input
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!profile || isUploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-fit"
                    >
                      {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                    </Button>
                    <p className="text-xs leading-5 text-slate-500">
                      JPG, PNG, or WebP. Maximum file size 5MB.
                    </p>
                  </div>
                </div>
              </div>
              <InfoRow label="Email" value={authEmail || profile?.email || "Loading..."} />
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Display name
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-primary/50"
                  placeholder="Optional"
                />
              </label>
              <Button type="submit" disabled={isSaving || isUploadingAvatar || !profile}>
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>

            <p className="mt-4 text-sm leading-6 text-slate-400">{status}</p>
          </Card>

          <div className="grid gap-5">
            <Card className="p-5 md:p-6">
              <CardTitle>Review History</CardTitle>
              {reviewHistory.isLoading ? (
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Loading review history...
                </p>
              ) : reviewHistory.totalReviews > 0 ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Total Reviews" value={String(reviewHistory.totalReviews)} />
                    <InfoRow
                      label="Latest Review"
                      value={
                        reviewHistory.latestReviewAt
                          ? formatDate(reviewHistory.latestReviewAt)
                          : "Not available"
                      }
                    />
                  </div>
                  <div className="mt-5">
                    <Button asChild variant="secondary">
                      <Link href="/my-reviews">View My Reviews</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm leading-6 text-slate-400">No reviews yet.</p>
                  <div className="mt-5">
                    <Button asChild variant="secondary">
                      <Link href="/review">Analyze your first hand</Link>
                    </Button>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-5 md:p-6">
              <CardTitle>Subscription</CardTitle>
              <div className="mt-5 grid gap-3">
                <InfoRow label="Current Plan" value={isCoach ? "Kevixo Coach" : "Free"} />
                <InfoRow label="Account Status" value={formatSubscriptionStatus(subscription)} />
                <InfoRow
                  label="Renewal Date"
                  value={
                    subscription?.currentPeriodEnd
                      ? formatDate(subscription.currentPeriodEnd)
                      : "Not scheduled"
                  }
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Subscription management is prepared for Kevixo Coach. You can continue using the
                free product while billing is configured.
              </p>
              <div className="mt-5">
                <Button asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

function AvatarPreview({ profile }: { profile: UserProfile | null }) {
  const label = profile?.displayName || profile?.email || "Kevixo user";

  if (profile?.avatarUrl) {
    return (
      <Image
        src={profile.avatarUrl}
        alt={`${label} profile photo`}
        width={96}
        height={96}
        unoptimized
        className="h-24 w-24 rounded-2xl border border-slate-700 object-cover"
      />
    );
  }

  return (
    <div
      aria-label="Default profile photo"
      className="flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-2xl font-semibold text-primary"
    >
      {getAvatarInitial(label)}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatSubscriptionStatus(subscription: Subscription | null) {
  if (!subscription || subscription.status === "free") {
    return "Active";
  }

  return subscription.status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAvatarInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "K";
}
