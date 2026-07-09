"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { buildWeeklyProgressReport } from "@/lib/progress-report";
import { readStoredReviews, type StoredReview } from "@/lib/review-store";

export default function ProgressPage() {
  const [reviews, setReviews] = useState<StoredReview[]>([]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setReviews(readStoredReviews(window.localStorage));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const report = useMemo(() => buildWeeklyProgressReport(reviews), [reviews]);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze My Hand" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Weekly Progress
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Your week in review
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              See what is improving, what still needs attention, and what to focus on next week.
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

        {!report.hasReliableTrends ? (
          <Card className="mt-8 border-primary/25 bg-primary/5 p-5 md:p-6">
            <CardTitle>Keep building your sample</CardTitle>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              You have {reviews.length} {reviews.length === 1 ? "review" : "reviews"} saved.
              Review at least 5 hands before Kevixo turns this into a meaningful weekly trend.
            </p>
          </Card>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressMetric label="Reviews This Week" value={report.reviewsThisWeek.toString()} highlight />
          <ProgressMetric label="Average Grade Trend" value={report.averageGradeTrend} />
          <ProgressMetric label="Confidence Trend" value={report.confidenceTrend} />
          <ProgressMetric label="Biggest Leak" value={report.biggestLeak} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-5 md:p-6">
            <CardTitle>Biggest Improvement</CardTitle>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-50">
              {report.biggestImprovement}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Based on the decisions showing up most positively in your recent reviews.
            </p>
          </Card>

          <Card className="border-primary/25 bg-primary/5 p-5 md:p-6">
            <CardTitle>Coach Summary</CardTitle>
            <p className="mt-4 text-lg leading-8 text-slate-100">{report.coachSummary}</p>
          </Card>
        </div>

        <Card className="mt-5 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Focus for Next Week</CardTitle>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-100">
                {report.focusForNextWeek}
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/my-reviews">Open My Reviews</Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
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
