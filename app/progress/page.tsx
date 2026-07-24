"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";

type ProgressReview = {
  id: string;
  reviewId: string;
  createdAt: string;
  created_at?: string;
  title: string;
  grade: string;
  confidence: number;
  leak: string;
  mistake: string;
  summary: string;
};

type ReviewsApiResponse = {
  ok: boolean;
  reviews?: ProgressReview[];
  error?: string;
};

type ProgressState = "loading" | "guest" | "ready" | "error";

const gradeScores: Record<string, number> = {
  "A+": 4.3,
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  D: 1,
};

export default function ProgressPage() {
  const [reviews, setReviews] = useState<ProgressReview[]>([]);
  const [state, setState] = useState<ProgressState>("loading");
  const [message, setMessage] = useState("Loading your progress...");

  const loadProgress = useCallback(async () => {
    setState("loading");
    setMessage("Loading your progress...");

    try {
      const headers = await getAuthHeaders();

      if (!headers.Authorization) {
        setReviews([]);
        setState("guest");
        setMessage("Create an account to track your poker improvement over time.");
        return;
      }

      const response = await fetch("/api/reviews", { headers });
      const payload = (await response.json()) as ReviewsApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Progress could not be loaded.");
      }

      setReviews(payload.reviews ?? []);
      setState("ready");
      setMessage("Your progress is based on reviews saved to your Kevixo account.");
    } catch (error) {
      setReviews([]);
      setState("error");
      setMessage(error instanceof Error ? error.message : "Progress could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadProgress();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadProgress]);

  const dashboard = useMemo(() => buildProgressDashboard(reviews), [reviews]);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze My Hand" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Player Progress
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Player Progress
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Track your poker study patterns, recent reviews, and the decisions that need the
              most attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/profile">View Player Profile</Link>
            </Button>
            <Button asChild>
              <Link href="/review">Review a Hand</Link>
            </Button>
          </div>
        </div>

        {state === "loading" ? (
          <ProgressMessage title="Loading progress" message="Kevixo is checking your saved reviews." />
        ) : null}

        {state === "guest" ? (
          <ProgressMessage
            title="Guest Progress"
            message="Create an account to track your poker improvement over time."
            actionLabel="Create Account"
            actionHref="/signup?redirect=/progress"
          />
        ) : null}

        {state === "error" ? (
          <ProgressMessage title="Progress unavailable" message={message} />
        ) : null}

        {state === "ready" && reviews.length === 0 ? (
          <ProgressMessage
            title="No reviews yet."
            message="Analyze your first hand and start building your poker profile."
            actionLabel="Analyze Hand"
            actionHref="/review"
          />
        ) : null}

        {state === "ready" && reviews.length > 0 ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ProgressMetric label="Total Reviews" value={String(dashboard.totalReviews)} highlight />
              <ProgressMetric label="Average Grade" value={dashboard.averageGrade} />
              <ProgressMetric label="Most Common Leak" value={dashboard.mostCommonLeak} />
              <ProgressMetric label="Last Review" value={dashboard.lastReview} />
            </div>

            <Card className="mt-5 border-primary/25 bg-primary/5 p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Your Current Focus
              </p>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-100">
                {dashboard.currentFocus}
              </p>
            </Card>

            <Card className="mt-5 p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Recent Reviews</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Your latest saved reviews, linked back to the full coaching report.
                  </p>
                </div>
                <Button asChild variant="secondary">
                  <Link href="/my-reviews">Open My Reviews</Link>
                </Button>
              </div>

              <div className="mt-5 grid gap-3">
                {reviews.slice(0, 5).map((review) => (
                  <RecentReviewRow key={review.reviewId} review={review} />
                ))}
              </div>
            </Card>
          </>
        ) : null}
      </section>
    </main>
  );
}

function ProgressMessage({
  actionHref,
  actionLabel,
  message,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  message: string;
  title: string;
}) {
  return (
    <Card className="mt-8 border-primary/25 bg-primary/5 p-5 md:p-6">
      <CardTitle>{title}</CardTitle>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{message}</p>
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function ProgressMetric({
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
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">{value}</p>
    </Card>
  );
}

function RecentReviewRow({ review }: { review: ProgressReview }) {
  return (
    <Link
      href={`/review?reviewId=${encodeURIComponent(review.reviewId)}`}
      className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/48 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 sm:grid-cols-[0.9fr_1.4fr_0.45fr_1.2fr]"
    >
      <span className="text-sm text-slate-400">{formatDate(getReviewDate(review))}</span>
      <span className="min-w-0 text-sm font-semibold text-slate-100">{review.title}</span>
      <span className="text-sm font-semibold text-primary">{review.grade}</span>
      <span className="line-clamp-2 text-sm leading-6 text-slate-300">{getMainLeak(review)}</span>
    </Link>
  );
}

function buildProgressDashboard(reviews: ProgressReview[]) {
  const sortedReviews = [...reviews].sort(
    (left, right) =>
      new Date(getReviewDate(right)).getTime() - new Date(getReviewDate(left)).getTime(),
  );
  const mostCommonLeak = mostFrequent(sortedReviews.map(getMainLeak), "No main leak yet");
  const strongestArea = mostFrequent(
    sortedReviews.map((review) => inferStrength(review.summary || review.mistake)),
    "decision review discipline",
  );

  return {
    totalReviews: sortedReviews.length,
    averageGrade: getAverageGrade(sortedReviews),
    mostCommonLeak,
    lastReview: sortedReviews[0] ? formatDate(getReviewDate(sortedReviews[0])) : "No reviews yet",
    currentFocus: buildCurrentFocus(sortedReviews, mostCommonLeak, strongestArea),
  };
}

function buildCurrentFocus(
  reviews: ProgressReview[],
  mostCommonLeak: string,
  strongestArea: string,
) {
  const combinedText = reviews.map((review) => `${review.mistake} ${review.leak}`).join(" ");
  const street = findMostCommonStreet(combinedText);

  if (reviews.length < 3) {
    return `You have ${reviews.length} saved ${
      reviews.length === 1 ? "review" : "reviews"
    }. Keep reviewing hands so Kevixo can separate one-off spots from real patterns.`;
  }

  if (street) {
    return `Recent reviews show you often struggle with ${street} decisions. Your next focus is to slow down on those spots and compare the better decision before checking results.`;
  }

  if (mostCommonLeak !== "No main leak yet") {
    return `Your current pattern is ${mostCommonLeak.toLowerCase()}. Keep using each review to turn that leak into one clear decision rule.`;
  }

  return `Your strongest area is ${strongestArea}. Keep building the habit by reviewing hands soon after you play.`;
}

function getAverageGrade(reviews: ProgressReview[]) {
  const scores = reviews.map((review) => gradeScore(review.grade)).filter(isNumber);

  if (scores.length === 0) {
    return "Not enough data";
  }

  return scoreToGrade(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getMainLeak(review: ProgressReview) {
  return review.leak || review.mistake || "No main leak recorded.";
}

function getReviewDate(review: ProgressReview) {
  return review.createdAt || review.created_at || "";
}

function inferStrength(text: string) {
  const normalizedText = text.toLowerCase();

  if (normalizedText.includes("preflop") || normalizedText.includes("3-bet")) {
    return "preflop discipline";
  }

  if (normalizedText.includes("value")) {
    return "value betting";
  }

  if (normalizedText.includes("fold")) {
    return "discipline under pressure";
  }

  if (normalizedText.includes("range")) {
    return "range thinking";
  }

  return "decision review discipline";
}

function findMostCommonStreet(text: string) {
  const normalizedText = text.toLowerCase();
  const streetCounts = [
    { label: "river", count: countMatches(normalizedText, "river") },
    { label: "turn", count: countMatches(normalizedText, "turn") },
    { label: "flop", count: countMatches(normalizedText, "flop") },
    { label: "preflop", count: countMatches(normalizedText, "preflop") },
  ].sort((left, right) => right.count - left.count);

  return streetCounts[0]?.count > 0 ? streetCounts[0].label : "";
}

function countMatches(text: string, value: string) {
  return text.split(value).length - 1;
}

function gradeScore(grade: string) {
  return gradeScores[grade.trim().toUpperCase()];
}

function scoreToGrade(score: number) {
  if (score >= 4.15) {
    return "A+";
  }

  if (score >= 3.85) {
    return "A";
  }

  if (score >= 3.5) {
    return "A-";
  }

  if (score >= 3.15) {
    return "B+";
  }

  if (score >= 2.85) {
    return "B";
  }

  if (score >= 2.5) {
    return "B-";
  }

  if (score >= 2.15) {
    return "C+";
  }

  if (score >= 1.85) {
    return "C";
  }

  return "D";
}

function mostFrequent(values: string[], fallback: string) {
  const cleanValues = values.map((value) => value.trim()).filter(Boolean);

  if (cleanValues.length === 0) {
    return fallback;
  }

  const counts = new Map<string, number>();

  cleanValues.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

function formatDate(value: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
