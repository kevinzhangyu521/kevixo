"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { getAuthHeaders } from "@/lib/auth-client";
import type { ReviewFeedbackEntry } from "@/lib/review-feedback";

const pageSize = 6;

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState<ReviewFeedbackEntry[]>([]);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewFeedbackEntry["status"]>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const loadFeedback = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setAdminError("");
      setAccessDenied(false);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          query,
          status: statusFilter,
        });
        const response = await fetch(`/api/admin/feedback?${params.toString()}`, {
          headers: await getAuthHeaders(),
          signal,
        });
        const payload = (await response.json()) as {
          ok: boolean;
          feedback?: ReviewFeedbackEntry[];
          total?: number;
          error?: string;
        };

        if (response.status === 401 || response.status === 403) {
          setAccessDenied(true);
          setFeedback([]);
          setTotalFeedback(0);
          setAdminError(payload.error ?? "Access denied.");
          return;
        }

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Feedback could not be loaded.");
        }

        setFeedback(payload.feedback ?? []);
        setTotalFeedback(payload.total ?? 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAdminError(
          error instanceof Error ? error.message : "Feedback could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [page, query, statusFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    const frameId = window.requestAnimationFrame(() => {
      void loadFeedback(controller.signal);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      controller.abort();
    };
  }, [loadFeedback]);

  const pageCount = Math.max(1, Math.ceil(totalFeedback / pageSize));
  const currentPage = Math.min(page, pageCount);

  async function markResolved(id: string) {
    setAdminError("");

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ id, status: "resolved" }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        setAdminError(payload.error ?? "Access denied.");
        return;
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Feedback could not be resolved.");
      }

      await loadFeedback();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Feedback could not be resolved.",
      );
    }
  }

  async function saveAdminNote(id: string, adminNote: string) {
    setAdminError("");

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ id, adminNote }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        setAdminError(payload.error ?? "Access denied.");
        return;
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Admin note could not be saved.");
      }

      await loadFeedback();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Admin note could not be saved.");
    }
  }

  async function deleteSpam(id: string) {
    setAdminError("");

    try {
      const response = await fetch(`/api/admin/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        setAdminError(payload.error ?? "Access denied.");
        return;
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Feedback could not be deleted.");
      }

      await loadFeedback();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Feedback could not be deleted.");
    }
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
              Review what players are telling you, follow up when needed, and keep the
              product feedback loop moving.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-800 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-slate-400">
              Feedback Database
            </span>
          </div>
        </div>

        <AdminNav active="feedback" />

        {accessDenied ? (
          <AccessDeniedCard />
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
                  placeholder="Search notes, email, grade, browser..."
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

            {adminError ? (
              <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
                {adminError}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              {feedback.map((entry) => (
                <FeedbackRow
                  key={entry.id}
                  entry={entry}
                  onDeleteSpam={deleteSpam}
                  onMarkResolved={markResolved}
                  onSaveAdminNote={saveAdminNote}
                />
              ))}
              {feedback.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-6 text-sm leading-6 text-slate-400">
                  {isLoading ? "Loading feedback..." : "No feedback matches this view."}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {feedback.length} of {totalFeedback} feedback notes.
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

function FeedbackRow({
  entry,
  onDeleteSpam,
  onMarkResolved,
  onSaveAdminNote,
}: {
  entry: ReviewFeedbackEntry;
  onDeleteSpam: (id: string) => void;
  onMarkResolved: (id: string) => void;
  onSaveAdminNote: (id: string, adminNote: string) => void;
}) {
  const [adminNote, setAdminNote] = useState(entry.adminNote ?? "");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setAdminNote(entry.adminNote ?? "");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [entry.adminNote]);

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
            Mark Resolved
          </Button>
          <Button variant="secondary" onClick={() => onDeleteSpam(entry.id)}>
            Delete
          </Button>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 border-t border-slate-800 pt-4 text-sm md:grid-cols-4">
        <FeedbackMeta label="Grade" value={entry.grade} />
        <ReviewIdMeta reviewId={entry.reviewId} />
        <FeedbackMeta
          label="Email"
          value={entry.email ?? "Not provided"}
          emphasize={Boolean(entry.email)}
        />
        <FeedbackMeta
          label="Device / Browser"
          value={entry.userAgent ?? entry.browser ?? "Not provided"}
        />
      </dl>

      <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm font-medium text-slate-200">
          Internal Note
          <input
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value.slice(0, 500))}
            placeholder="Add an internal note..."
            className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 placeholder:text-slate-600"
          />
        </label>
        <Button
          variant="secondary"
          disabled={adminNote === (entry.adminNote ?? "")}
          onClick={() => onSaveAdminNote(entry.id, adminNote)}
        >
          Save Note
        </Button>
      </div>
    </article>
  );
}

function ReviewIdMeta({ reviewId }: { reviewId?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Linked Review
      </dt>
      <dd className="mt-1">
        {reviewId ? (
          <Link
            href={`/review?reviewId=${encodeURIComponent(reviewId)}`}
            className="inline-flex max-w-full rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary/45 hover:bg-primary/15"
          >
            <span className="truncate">{reviewId}</span>
          </Link>
        ) : (
          <span className="text-slate-300">Not provided</span>
        )}
      </dd>
    </div>
  );
}

function FeedbackMeta({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</dt>
      <dd
        className={[
          "mt-1 break-words",
          emphasize ? "font-medium text-slate-100" : "text-slate-300",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
