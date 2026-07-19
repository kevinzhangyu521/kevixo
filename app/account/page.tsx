"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";
import {
  getCurrentUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/lib/profile-client";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Subscription } from "@/lib/subscription";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [status, setStatus] = useState("Loading your account...");
  const [isSaving, setIsSaving] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus("Accounts are not configured yet.");
      return;
    }

    try {
      const nextProfile = await getCurrentUserProfile();

      if (!nextProfile) {
        router.push("/login?redirect=/account");
        return;
      }

      setProfile(nextProfile);
      setDisplayName(nextProfile.displayName ?? "");
      setAvatarUrl(nextProfile.avatarUrl ?? "");

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

      setStatus("Account ready.");
    } catch (error) {
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
      const nextProfile = await updateUserProfile({ avatarUrl, displayName });
      setProfile(nextProfile);
      setStatus("Profile saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      setIsSaving(false);
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
            <div className="mt-5 grid gap-3">
              <InfoRow label="Email" value={profile?.email ?? "Loading..."} />
              <InfoRow label="Account ID" value={profile?.id ?? "Loading..."} />
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
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Avatar URL
                <input
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-primary/50"
                  placeholder="Optional"
                />
              </label>
              <Button type="submit" disabled={isSaving || !profile}>
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>

            <p className="mt-4 text-sm leading-6 text-slate-400">{status}</p>
          </Card>

          <div className="grid gap-5">
            <Card className="p-5 md:p-6">
              <CardTitle>Review History</CardTitle>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Your account is ready for saved review ownership. Full synced review history will
                appear here in a later sprint. Your current browser history remains available today.
              </p>
              <div className="mt-5">
                <Button asChild variant="secondary">
                  <Link href="/my-reviews">Open My Reviews</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-5 md:p-6">
              <CardTitle>Subscription</CardTitle>
              <div className="mt-5 grid gap-3">
                <InfoRow label="Current Plan" value={isCoach ? "Kevixo Coach" : "Free"} />
                <InfoRow label="Status" value={subscription?.status ?? "Free"} />
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
