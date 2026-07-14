"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders, getCurrentAccessToken } from "@/lib/auth-client";
import { buildPlayerProfile } from "@/lib/player-profile";
import { readStoredReviews, type StoredReview } from "@/lib/review-store";
import type { Subscription } from "@/lib/subscription";

export default function ProfilePage() {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [billingStatus, setBillingStatus] = useState("Sign in to manage your plan.");
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const loadBilling = useCallback(async () => {
    const token = await getCurrentAccessToken();

    if (!token) {
      setBillingStatus("Sign in to manage Coach and billing.");
      return;
    }

    try {
      const response = await fetch("/api/billing/subscription", {
        headers: await getAuthHeaders(),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        subscription?: Subscription;
        isCoach?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.subscription) {
        throw new Error(payload.error ?? "Billing could not be loaded.");
      }

      setSubscription(payload.subscription);
      setIsCoach(Boolean(payload.isCoach));
      setBillingStatus("Billing is ready.");
    } catch (error) {
      setBillingStatus(error instanceof Error ? error.message : "Billing could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setReviews(readStoredReviews(window.localStorage));
      void loadBilling();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadBilling]);

  const profile = useMemo(() => buildPlayerProfile(reviews), [reviews]);

  async function openBillingPortal() {
    setIsBillingLoading(true);
    setBillingStatus("Opening Stripe...");

    try {
      const token = await getCurrentAccessToken();

      if (!token) {
        window.location.href = "/login?redirect=/profile";
        return;
      }

      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      const payload = (await response.json()) as { ok: boolean; url?: string; error?: string };

      if (!response.ok || !payload.ok || !payload.url) {
        throw new Error(payload.error ?? "Billing portal could not be opened.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setBillingStatus(error instanceof Error ? error.message : "Billing portal could not be opened.");
      setIsBillingLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze My Hand" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Player Profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Your improvement map
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Kevixo turns your saved hand reviews into simple coaching trends you can act on
              after each session.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/my-reviews">My Reviews</Link>
            </Button>
            <Button asChild>
              <Link href="/review">Analyze a Hand</Link>
            </Button>
          </div>
        </div>

        {!profile.hasReliableTrends ? (
          <Card className="mt-8 border-primary/25 bg-primary/5 p-5 md:p-6">
            <CardTitle>More reviews will sharpen this profile</CardTitle>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              You have {profile.handsReviewed}{" "}
              {profile.handsReviewed === 1 ? "review" : "reviews"} saved. Kevixo can show early
              signals now, but at least 5 reviews are needed before reliable coaching trends can be
              identified.
            </p>
          </Card>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileMetric label="Overall Grade" value={profile.overallGrade} highlight />
          <ProfileMetric label="Average Confidence" value={`${profile.averageConfidence}%`} />
          <ProfileMetric label="Hands Reviewed" value={profile.handsReviewed.toString()} />
          <ProfileMetric label="Biggest Leak" value={profile.biggestLeak} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5 md:p-6">
            <CardTitle>Strongest Skill</CardTitle>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-50">
              {profile.strongestSkill}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              This is based on your highest graded recent reviews and the decisions Kevixo found
              most stable.
            </p>
          </Card>

          <Card className="border-primary/25 bg-primary/5 p-5 md:p-6">
            <CardTitle>Coach Recommendation</CardTitle>
            <p className="mt-4 text-lg leading-8 text-slate-100">
              {profile.coachRecommendation}
            </p>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <BillingCard
            billingStatus={billingStatus}
            isBillingLoading={isBillingLoading}
            isCoach={isCoach}
            onManageBilling={openBillingPortal}
            subscription={subscription}
          />
          <CoachAccessCard isCoach={isCoach} />
        </div>

        <Card className="mt-5 p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Recent Grades</CardTitle>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Your last 10 saved reviews, newest first.
              </p>
            </div>
            <span className="rounded-full border border-slate-800 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-slate-400">
              Last 10
            </span>
          </div>

          {profile.recentGrades.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {profile.recentGrades.map((review) => (
                <Link
                  key={review.reviewId}
                  href={`/review?reviewId=${encodeURIComponent(review.reviewId)}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/48 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{review.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(review.createdAt)}</p>
                  </div>
                  <span className="inline-flex h-11 min-w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-xl font-semibold text-primary">
                    {review.grade}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/48 p-4">
              <p className="text-sm leading-6 text-slate-400">
                No saved reviews yet. Analyze one hand to start building your profile.
              </p>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}

function BillingCard({
  billingStatus,
  isBillingLoading,
  isCoach,
  onManageBilling,
  subscription,
}: {
  billingStatus: string;
  isBillingLoading: boolean;
  isCoach: boolean;
  onManageBilling: () => void;
  subscription: Subscription | null;
}) {
  return (
    <Card className="p-5 md:p-6">
      <CardTitle>Billing</CardTitle>
      <div className="mt-5 grid gap-3">
        <BillingRow label="Current Plan" value={isCoach ? "Kevixo Coach" : "Free"} />
        <BillingRow label="Subscription Status" value={subscription?.status ?? "Free"} />
        <BillingRow
          label="Renewal Date"
          value={subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "Not scheduled"}
        />
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        {isCoach ? (
          <Button onClick={onManageBilling} disabled={isBillingLoading}>
            {isBillingLoading ? "Opening..." : "Manage Subscription"}
          </Button>
        ) : (
          <Button asChild>
            <Link href="/pricing">Upgrade to Coach</Link>
          </Button>
        )}
        {isCoach ? (
          <Button onClick={onManageBilling} disabled={isBillingLoading} variant="secondary">
            Cancel Subscription
          </Button>
        ) : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{billingStatus}</p>
    </Card>
  );
}

function CoachAccessCard({ isCoach }: { isCoach: boolean }) {
  const features = ["Monthly Coach Report", "Coach Timeline", "Full Historical Progress"];

  return (
    <Card className="p-5 md:p-6">
      <CardTitle>Coach Features</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Coach is designed for long-term improvement. Free Kevixo remains available for hand review,
        daily practice, and weekly progress.
      </p>
      <div className="mt-5 grid gap-3">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-3 text-sm font-medium text-slate-200"
          >
            {isCoach ? feature : `${feature} - Available in Kevixo Coach`}
          </div>
        ))}
      </div>
    </Card>
  );
}

function BillingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-slate-50">{value}</p>
    </div>
  );
}

function ProfileMetric({
  highlight = false,
  label,
  value,
}: {
  highlight?: boolean;
  label: string;
  value: string;
}) {
  return (
    <Card className={["p-5 md:p-6", highlight ? "border-primary/35 bg-primary/5" : ""].join(" ")}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{value}</p>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
