"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { FounderDashboardData } from "@/lib/admin-dashboard";

const adminKey = process.env.NEXT_PUBLIC_ADMIN_FEEDBACK_KEY;

export default function FounderDashboardPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [dashboard, setDashboard] = useState<FounderDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  const loadDashboard = useCallback(
    async (signal?: AbortSignal) => {
      if (!isAuthorized || !adminKey) {
        return;
      }

      setIsLoading(true);
      setAdminError("");

      try {
        const response = await fetch("/api/admin/dashboard", {
          headers: {
            "x-admin-passcode": adminKey,
          },
          signal,
        });
        const payload = (await response.json()) as {
          ok: boolean;
          dashboard?: FounderDashboardData;
          error?: string;
        };

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
    },
    [isAuthorized],
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (window.sessionStorage.getItem("kevixo.feedbackAdminAuthorized") === "true") {
        setIsAuthorized(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

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

  function handleAuthorize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminKey || passcode !== adminKey) {
      return;
    }

    window.sessionStorage.setItem("kevixo.feedbackAdminAuthorized", "true");
    setIsAuthorized(true);
  }

  function handleLogout() {
    window.sessionStorage.removeItem("kevixo.feedbackAdminAuthorized");
    setIsAuthorized(false);
    setPasscode("");
    setDashboard(null);
    setAdminError("");
  }

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
            {isAuthorized ? (
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            ) : null}
            <span className="rounded-full border border-slate-800 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-slate-400">
              Operations Dashboard
            </span>
          </div>
        </div>

        <AdminNav active="dashboard" />

        {!isAuthorized ? (
          <AdminGate
            passcode={passcode}
            hasKey={Boolean(adminKey)}
            onPasscodeChange={setPasscode}
            onSubmit={handleAuthorize}
          />
        ) : (
          <div className="mt-8 grid gap-5">
            {adminError ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
                {adminError}
              </div>
            ) : null}

            {dashboard ? (
              <>
                <OverviewCards dashboard={dashboard} />
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

function OverviewCards({ dashboard }: { dashboard: FounderDashboardData }) {
  const cards = [
    { label: "Reviews Today", value: dashboard.overview.reviewsToday },
    { label: "Reviews This Week", value: dashboard.overview.reviewsThisWeek },
    { label: "Feedback Today", value: dashboard.overview.feedbackToday },
    { label: "Open Feedback", value: dashboard.overview.openFeedback },
    { label: "Resolved Feedback", value: dashboard.overview.resolvedFeedback },
    { label: "Feedback Rate", value: `${dashboard.overview.feedbackRate}%` },
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

function AdminGate({
  hasKey,
  passcode,
  onPasscodeChange,
  onSubmit,
}: {
  hasKey: boolean;
  passcode: string;
  onPasscodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="mt-8 max-w-xl p-5 md:p-6">
      <CardTitle>Admin Access</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Enter the founder passcode to open the operations dashboard.
      </p>
      {!hasKey ? (
        <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
          Admin access is not configured yet, so the dashboard cannot be viewed in production.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 grid gap-4">
          <input
            value={passcode}
            onChange={(event) => onPasscodeChange(event.target.value)}
            type="password"
            placeholder="Admin passcode"
            className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 placeholder:text-slate-600"
          />
          <Button type="submit">Open Dashboard</Button>
        </form>
      )}
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
