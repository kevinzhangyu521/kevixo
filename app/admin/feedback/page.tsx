"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import {
  createReviewFeedbackStore,
  deleteReviewFeedback,
  reviewFeedbackStorageKey,
  updateReviewFeedbackStatus,
  type ReviewFeedbackEntry,
} from "@/lib/review-feedback";

const pageSize = 6;
const adminKey = process.env.NEXT_PUBLIC_ADMIN_FEEDBACK_KEY;

export default function FeedbackAdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [feedback, setFeedback] = useState<ReviewFeedbackEntry[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewFeedbackEntry["status"]>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (window.sessionStorage.getItem("kevixo.feedbackAdminAuthorized") === "true") {
        setIsAuthorized(true);
        setFeedback(createReviewFeedbackStore(window.localStorage).read());
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const filteredFeedback = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return feedback.filter((entry) => {
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      const searchable = [
        entry.message,
        entry.improvement,
        entry.usefulPart,
        entry.grade,
        entry.email,
        entry.reviewId,
        entry.browser,
        entry.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [feedback, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredFeedback.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedFeedback = filteredFeedback.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function handleAuthorize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminKey || passcode !== adminKey) {
      return;
    }

    window.sessionStorage.setItem("kevixo.feedbackAdminAuthorized", "true");
    setIsAuthorized(true);
    setFeedback(createReviewFeedbackStore(window.localStorage).read());
  }

  function refreshFeedback() {
    setFeedback(createReviewFeedbackStore(window.localStorage).read());
  }

  function markResolved(id: string) {
    updateReviewFeedbackStatus(createReviewFeedbackStore(window.localStorage), id, "resolved");
    refreshFeedback();
  }

  function deleteSpam(id: string) {
    deleteReviewFeedback(createReviewFeedbackStore(window.localStorage), id);
    refreshFeedback();
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
              Feedback
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Local admin view for review feedback stored in this browser.
            </p>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-slate-400">
            Storage key: {reviewFeedbackStorageKey}
          </span>
        </div>

        {!isAuthorized ? (
          <AdminGate
            passcode={passcode}
            hasKey={Boolean(adminKey)}
            onPasscodeChange={setPasscode}
            onSubmit={handleAuthorize}
          />
        ) : (
          <Card className="mt-8 p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                Search
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search message, grade, status, browser..."
                  className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 placeholder:text-slate-600"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as typeof statusFilter);
                    setPage(1);
                  }}
                  className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </label>
            </div>

            <div className="mt-6 grid gap-4">
              {pagedFeedback.map((entry) => (
                <FeedbackRow
                  key={entry.id}
                  entry={entry}
                  onDeleteSpam={deleteSpam}
                  onMarkResolved={markResolved}
                />
              ))}
              {pagedFeedback.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-6 text-sm leading-6 text-slate-400">
                  No feedback matches this view.
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {pagedFeedback.length} of {filteredFeedback.length} feedback items.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}
      </section>
    </main>
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
        This page is gated with the `NEXT_PUBLIC_ADMIN_FEEDBACK_KEY` environment variable.
      </p>
      {!hasKey ? (
        <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
          Admin key is not configured yet, so feedback cannot be viewed in production.
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
          <Button type="submit">Unlock Feedback</Button>
        </form>
      )}
    </Card>
  );
}

function FeedbackRow({
  entry,
  onDeleteSpam,
  onMarkResolved,
}: {
  entry: ReviewFeedbackEntry;
  onDeleteSpam: (id: string) => void;
  onMarkResolved: (id: string) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {entry.status}
            </span>
            <span className="text-xs text-slate-500">{formatDate(entry.createdAt)}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-50">
            {entry.usefulPart}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {entry.message || "No improvement message provided."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={entry.status === "resolved"}
            onClick={() => onMarkResolved(entry.id)}
          >
            Resolve
          </Button>
          <Button variant="secondary" onClick={() => onDeleteSpam(entry.id)}>
            Delete Spam
          </Button>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 border-t border-slate-800 pt-4 text-sm md:grid-cols-4">
        <FeedbackMeta label="Grade" value={entry.grade} />
        <FeedbackMeta label="Review ID" value={entry.reviewId ?? "Not stored"} />
        <FeedbackMeta label="Email" value={entry.email ?? "Not stored"} />
        <FeedbackMeta label="Browser" value={entry.browser ?? "Not stored"} />
      </dl>
    </article>
  );
}

function FeedbackMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-slate-300">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
