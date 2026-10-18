"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";
import type { FounderDashboardData } from "@/lib/admin-dashboard";

type RangePreset = "last-30" | "previous-30" | "custom";

export default function FounderDashboardPage() {
  const [dashboard, setDashboard] = useState<FounderDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [rangePreset, setRangePreset] = useState<RangePreset>("last-30");
  const [customStart, setCustomStart] = useState(getDateInputValue(daysAgo(29)));
  const [customEnd, setCustomEnd] = useState(getDateInputValue(new Date()));
  const rangeQuery = useMemo(() => {
    const searchParams = new URLSearchParams({ range: rangePreset });

    if (rangePreset === "custom") {
      searchParams.set("start", customStart);
      searchParams.set("end", customEnd);
    }

    return searchParams.toString();
  }, [customEnd, customStart, rangePreset]);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setAdminError("");
    setAccessDenied(false);

    try {
      const response = await fetch(`/api/admin/dashboard?${rangeQuery}`, {
        headers: await getAuthHeaders(),
        signal,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        dashboard?: FounderDashboardData;
        error?: string;
      };

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        setDashboard(null);
        setAdminError(payload.error ?? "Access denied.");
        return;
      }

      if (!response.ok || !payload.ok || !payload.dashboard) {
        throw new Error(payload.error ?? "Dashboard could not be loaded.");
      }

      setDashboard(payload.dashboard);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setAdminError(error instanceof Error ? error.message : "Dashboard could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [rangeQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const frameId = window.requestAnimationFrame(() => {
      void loadDashboard(controller.signal);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      controller.abort();
    };
  }, [loadDashboard]);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Review" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Admin
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Founder Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Monitor review volume, feedback quality, and early product signals from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-800 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-slate-400">
              Operations Dashboard
            </span>
          </div>
        </div>

        <AdminNav active="dashboard" />

        <DateRangeControls
          customEnd={customEnd}
          customStart={customStart}
          onCustomEndChange={setCustomEnd}
          onCustomStartChange={setCustomStart}
          onPresetChange={setRangePreset}
          preset={rangePreset}
        />

        {accessDenied ? (
          <AccessDeniedCard />
        ) : (
          <div className="mt-8 grid gap-5">
            {adminError ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
                {adminError}
              </div>
            ) : null}

            {dashboard ? (
              <>
                <VerifiedUserCards dashboard={dashboard} />
                <OverviewCards dashboard={dashboard} />
                <RevenueCards dashboard={dashboard} />
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <FeedbackInsights dashboard={dashboard} />
                  <RecentActivity dashboard={dashboard} />
                </div>
                <div className="grid gap-5 lg:grid-cols-3">
                  <BreakdownCard title="Browser Breakdown" rows={dashboard.browserBreakdown} />
                  <BreakdownCard title="Device Breakdown" rows={dashboard.deviceBreakdown} />
                  <GradeDistribution dashboard={dashboard} />
                </div>
              </>
            ) : (
              <Card className="p-5 text-sm leading-6 text-slate-400 md:p-6">
                {isLoading ? "Loading dashboard..." : "No dashboard data loaded yet."}
              </Card>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function DateRangeControls({
  customEnd,
  customStart,
  onCustomEndChange,
  onCustomStartChange,
  onPresetChange,
  preset,
}: {
  customEnd: string;
  customStart: string;
  onCustomEndChange: (value: string) => void;
  onCustomStartChange: (value: string) => void;
  onPresetChange: (value: RangePreset) => void;
  preset: RangePreset;
}) {
  return (
    <Card className="mt-6 p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>Growth date range</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            All growth cards use UTC calendar dates and the same selected range.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Range
            <select
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              onChange={(event) => onPresetChange(event.target.value as RangePreset)}
              value={preset}
            >
              <option value="last-30">Last 30 days</option>
              <option value="previous-30">Previous 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          {preset === "custom" ? (
            <>
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                Start date
                <input
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => onCustomStartChange(event.target.value)}
                  type="date"
                  value={customStart}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                End date
                <input
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => onCustomEndChange(event.target.value)}
                  type="date"
                  value={customEnd}
                />
              </label>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function RevenueCards({ dashboard }: { dashboard: FounderDashboardData }) {
  const cards = [
    { label: "Active Subscribers", value: dashboard.revenue.activeSubscribers },
    { label: "Monthly Recurring Revenue", value: `$${dashboard.revenue.mrr.toFixed(2)}` },
    { label: "New Subscribers", value: dashboard.revenue.newSubscribers },
    { label: "Cancelled Subscribers", value: dashboard.revenue.cancelledSubscribers },
  ];

  return (
    <Card className="border-primary/25 bg-primary/5 p-5 md:p-6">
      <CardTitle>Revenue</CardTitle>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OverviewCards({ dashboard }: { dashboard: FounderDashboardData }) {
  const cards = [
    { label: "Reviews Started (raw events)", value: dashboard.overview.reviewsStarted },
    { label: "Saved Reviews (raw records)", value: dashboard.overview.reviewsCompleted },
    { label: "Open Feedback (range)", value: dashboard.overview.openFeedback },
    { label: "Resolved Feedback (range)", value: dashboard.overview.resolvedFeedback },
    { label: "Feedback Rate (raw records)", value: `${dashboard.overview.feedbackRate}%` },
    { label: "Share Rate (raw events)", value: `${dashboard.overview.shareRate}%` },
    { label: "Emails Collected (range)", value: dashboard.overview.emailsCollected },
    { label: "Repeat Visitor IDs (not users)", value: dashboard.overview.returningVisitors },
    { label: "Repeat Review Visitor IDs (not users)", value: dashboard.overview.returningUsers },
    { label: "Reviews per Visitor ID", value: dashboard.overview.reviewsPerUser },
    { label: "Average Reviews per Visitor ID", value: dashboard.overview.averageReviewsPerPlayer },
    { label: "Active Visitor IDs (raw, final 7 days)", value: dashboard.overview.weeklyActivePlayers },
    { label: "Repeat Review Visitor IDs (final 7 days)", value: dashboard.overview.weeklyReturningPlayers },
    {
      label: "Average Reviews per Active Player",
      value: dashboard.overview.averageReviewsPerActivePlayer,
    },
    { label: "Daily Challenge Attempts (raw events)", value: dashboard.overview.dailyChallengeAttempts },
    {
      label: "Daily Challenge Completion Rate",
      value: `${dashboard.overview.dailyChallengeCompletionRate}%`,
    },
    { label: "Average Streak", value: dashboard.overview.averageStreak },
    { label: "Average Grade", value: dashboard.overview.averageGrade },
    { label: "Average Confidence", value: `${dashboard.overview.averageConfidence}%` },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
            {card.value}
          </p>
        </Card>
      ))}
    </div>
  );
}

function VerifiedUserCards({ dashboard }: { dashboard: FounderDashboardData }) {
  const cards = [
    { label: "Verified External Registrations", value: dashboard.verifiedUsers.registeredUsers },
    { label: "External Users with First Review", value: dashboard.verifiedUsers.firstReviewUsers },
    { label: "External Users with Second Review", value: dashboard.verifiedUsers.secondReviewUsers },
    { label: "7-Day Active Users", value: dashboard.verifiedUsers.recentlyActiveUsers },
    { label: "Anonymous Saved Reviews", value: dashboard.anonymousActivity.anonymousReviewRecords },
    { label: "Anonymous Visitor IDs", value: dashboard.anonymousActivity.anonymousVisitors },
    { label: "Unknown Review Records", value: dashboard.unknownActivity.unknownReviewRecords },
    { label: "Unknown Activity Records", value: dashboard.unknownActivity.unknownEvents },
    { label: "Internal Review Records", value: dashboard.internalActivity.internalReviewRecords },
    { label: "Internal Activity Records", value: dashboard.internalActivity.internalEvents },
  ];

  return (
    <div className="grid gap-5">
    <Card className="border-primary/25 bg-primary/5 p-5 md:p-6">
      <CardTitle>Verified External User Growth</CardTitle>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {formatRangeLabel(dashboard.range)}. Excludes test and admin accounts. First and second
        reviews are each counted only when that saved review falls in this range. 7-day activity
        means a verified player used a product feature during the final seven days of the range.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-950/48 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{card.value}</p></div>)}
      </div>
    </Card>
    <Card className="p-5 md:p-6">
      <CardTitle>GA4 traffic</CardTitle>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        GA4 is an external traffic source and is not used to calculate verified player growth.
        A server-side GA4 connection is not configured.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Sessions", value: dashboard.ga4.sessions ?? "--" },
          { label: "Active Users", value: dashboard.ga4.activeUsers ?? "--" },
          { label: "Engaged Sessions", value: dashboard.ga4.engagedSessions ?? "--" },
        ].map((card) => <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-950/48 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{card.value}</p></div>)}
      </div>
    </Card>
    </div>
  );
}

function FeedbackInsights({ dashboard }: { dashboard: FounderDashboardData }) {
  const leader = dashboard.usefulParts.reduce(
    (best, row) => (row.count > best.count ? row : best),
    dashboard.usefulParts[0],
  );

  return (
    <Card className="p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Feedback Insights</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Most selected useful part:{" "}
            <span className="font-semibold text-primary">{leader?.label ?? "N/A"}</span>
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {dashboard.usefulParts.map((row) => (
          <BarRow key={row.label} label={row.label} count={row.count} percentage={row.percentage} />
        ))}
      </div>
    </Card>
  );
}

function RecentActivity({ dashboard }: { dashboard: FounderDashboardData }) {
  return (
    <Card className="p-5 md:p-6">
      <CardTitle>Recent Activity</CardTitle>
      <div className="mt-5 grid gap-3">
        {dashboard.recentActivity.map((activity, index) => (
          <div
            key={`${activity.type}-${activity.time}-${index}`}
            className="rounded-xl border border-slate-800 bg-slate-950/48 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-100">{activity.type}</span>
              <span className="text-xs text-slate-500">{formatDate(activity.time)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {activity.reviewId ? (
                <Link
                  href={`/review?reviewId=${encodeURIComponent(activity.reviewId)}`}
                  className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-semibold text-primary transition hover:border-primary/45"
                >
                  {activity.reviewId}
                </Link>
              ) : (
                <span className="rounded-full border border-slate-800 px-3 py-1 text-slate-400">
                  No linked review
                </span>
              )}
              <span className="rounded-full border border-slate-800 px-3 py-1 text-slate-300">
                {activity.status}
              </span>
            </div>
          </div>
        ))}
        {dashboard.recentActivity.length === 0 ? (
          <p className="text-sm leading-6 text-slate-400">No activity yet.</p>
        ) : null}
      </div>
    </Card>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; count: number; percentage: number }>;
}) {
  return (
    <Card className="p-5 md:p-6">
      <CardTitle>{title}</CardTitle>
      <div className="mt-5 grid gap-4">
        {rows.map((row) => (
          <BarRow key={row.label} label={row.label} count={row.count} percentage={row.percentage} />
        ))}
      </div>
    </Card>
  );
}

function GradeDistribution({ dashboard }: { dashboard: FounderDashboardData }) {
  const colors: Record<string, string> = {
    A: "bg-emerald-400",
    B: "bg-primary",
    C: "bg-amber-300",
    D: "bg-rose-400",
  };

  return (
    <Card className="p-5 md:p-6">
      <CardTitle>Grade Distribution</CardTitle>
      <div className="mt-5 grid gap-4">
        {dashboard.gradeDistribution.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-800 bg-slate-950/70 font-semibold text-slate-100">
                {row.label}
              </span>
              <span className="text-slate-400">
                {row.count} · {row.percentage}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-900">
              <div
                className={["h-full rounded-full", colors[row.label] ?? "bg-slate-500"].join(" ")}
                style={{ width: `${row.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BarRow({
  label,
  count,
  percentage,
}: {
  label: string;
  count: number;
  percentage: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="text-slate-500">
          {count} · {percentage}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-900">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function AccessDeniedCard() {
  return (
    <Card className="mt-8 max-w-xl p-5 md:p-6">
      <CardTitle>Access Denied</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        This page is available only to active Kevixo admin accounts.
      </p>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatRangeLabel(range: FounderDashboardData["range"]) {
  const end = new Date(range.end);
  end.setUTCDate(end.getUTCDate() - 1);
  return `${formatDate(range.start)} to ${formatDate(end.toISOString())} (UTC)`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}
