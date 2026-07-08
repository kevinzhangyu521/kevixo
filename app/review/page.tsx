"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import {
  trackAnalyze,
  trackDemoSelected,
  trackFeedback,
  trackReviewCompleted,
} from "@/lib/analytics";
import { demoHands } from "@/lib/demo-hands";
import { readImportedHandModel } from "@/lib/hand-import";
import {
  buildMemoryEntry,
  createPlayerMemory,
  getPlayerMemoryInsights,
  saveReviewToMemory,
  type PlayerMemoryEntry,
} from "@/lib/player-memory";
import {
  buildReviewFeedbackEntry,
  usefulPartOptions,
  type UsefulPart,
} from "@/lib/review-feedback";
import { findStoredReview, saveStoredReview } from "@/lib/review-store";
import type { CoachingReport } from "@/services/ai";

const loadingSteps = [
  "Reading hand history",
  "Understanding positions",
  "Building opponent range",
  "Calculating decisions",
  "Detecting leaks",
  "Writing coaching report",
];

const minimumLoadingMs = 3200;

type AnalyzeResponse =
  | { ok: true; report: CoachingReport }
  | { ok: false; error: string };

type ErrorResponse = { error?: string };

export default function ReviewPage() {
  const [handHistory, setHandHistory] = useState(demoHands[0].hand);
  const [selectedDemoId, setSelectedDemoId] = useState(demoHands[0].id);
  const [report, setReport] = useState<CoachingReport | null>(null);
  const [memoryReviews, setMemoryReviews] = useState<PlayerMemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [reviewLookupMessage, setReviewLookupMessage] = useState("");
  const [feedbackUsefulPart, setFeedbackUsefulPart] = useState<UsefulPart>("Biggest Mistake");
  const [feedbackImprovement, setFeedbackImprovement] = useState("");
  const [isFeedbackDismissed, setIsFeedbackDismissed] = useState(false);
  const [isFeedbackSent, setIsFeedbackSent] = useState(false);
  const [isFeedbackSaving, setIsFeedbackSaving] = useState(false);
  const [feedbackStatusMessage, setFeedbackStatusMessage] = useState(
    "No account required. Feedback helps improve Kevixo.",
  );

  const loadStoredReviewFromServer = useCallback(async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`);
      const payload = (await response.json()) as {
        ok: boolean;
        review?: {
          reviewId: string;
          createdAt: string;
          handHistory: string;
          report: CoachingReport;
        };
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.review) {
        throw new Error(payload.error ?? "Review not available.");
      }

      setHandHistory(payload.review.handHistory);
      setSelectedDemoId("");
      setReport(payload.review.report);
      setReviewLookupMessage("");
      saveStoredReview(window.localStorage, {
        reviewId: payload.review.reviewId,
        createdAt: payload.review.createdAt,
        handHistory: payload.review.handHistory,
        report: payload.review.report,
      });
    } catch {
      setReviewLookupMessage("Review not available.");
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMemoryReviews(createPlayerMemory(window.localStorage).read());
      const importedHand = readImportedHandModel(window.localStorage);
      const reviewId = new URLSearchParams(window.location.search).get("reviewId");

      if (reviewId) {
        const storedReview = findStoredReview(window.localStorage, reviewId);

        if (storedReview) {
          setHandHistory(storedReview.handHistory);
          setSelectedDemoId("");
          setReport(storedReview.report);
          setReviewLookupMessage("");
        } else {
          setReviewLookupMessage("Loading review...");
          void loadStoredReviewFromServer(reviewId);
        }
      }

      if (!reviewId && importedHand) {
        setHandHistory(importedHand);
        setSelectedDemoId("");
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadStoredReviewFromServer]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  const trimmedHand = handHistory.trim();
  const characterCount = handHistory.length;
  const canAnalyze = useMemo(() => trimmedHand.length > 0 && !isLoading, [trimmedHand, isLoading]);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedHand) {
      setError("Paste a complete hand history before analyzing.");
      return;
    }

    setError("");
    setReport(null);
    setIsLoading(true);
    setActiveStep(0);
    setFeedbackUsefulPart("Biggest Mistake");
    setFeedbackImprovement("");
    setIsFeedbackDismissed(false);
    setIsFeedbackSent(false);
    setIsFeedbackSaving(false);
    setFeedbackStatusMessage("No account required. Feedback helps improve Kevixo.");
    setReviewLookupMessage("");
    trackAnalyze();

    try {
      const [response] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handHistory }),
        }),
        wait(minimumLoadingMs),
      ]);

      const payload = (await response.json()) as AnalyzeResponse | ErrorResponse;

      if (!response.ok || !("ok" in payload)) {
        throw new Error(getResponseError(payload, "Kevixo could not analyze this hand."));
      }

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setReport(payload.report);
      saveStoredReview(window.localStorage, {
        reviewId: payload.report.reviewId,
        createdAt: new Date().toISOString(),
        handHistory,
        report: payload.report,
      });
      trackReviewCompleted(payload.report);
      const nextMemoryReviews = saveReviewToMemory(
        createPlayerMemory(window.localStorage),
        buildMemoryEntry(payload.report),
      );
      setMemoryReviews(nextMemoryReviews);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Network error. Please try again with the same hand history.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!report || isFeedbackSaving) {
      return;
    }

    const feedbackEntry = buildReviewFeedbackEntry({
      usefulPart: feedbackUsefulPart,
      improvement: feedbackImprovement,
      grade: report.grade,
      reviewId: report.reviewId,
      browser: window.navigator.userAgent,
      userAgent: window.navigator.userAgent,
      sourcePage: "/review",
    });

    setIsFeedbackSaving(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackEntry),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        feedback?: typeof feedbackEntry;
        error?: string;
        supabaseError?: {
          code?: string;
          message?: string;
          details?: string;
          hint?: string;
        };
      };

      if (!response.ok || !payload.ok || !payload.feedback) {
        throw new Error(formatFeedbackInsertError(payload));
      }

      trackFeedback({
        usefulPart: payload.feedback.usefulPart,
        hasImprovementText: payload.feedback.improvement.length > 0,
      });
      console.log("Kevixo review feedback", payload.feedback);
      setFeedbackImprovement(payload.feedback.improvement);
      setIsFeedbackSent(true);
      setFeedbackStatusMessage("Feedback sent. Thank you.");
    } catch (caughtError) {
      console.error("Kevixo feedback insert failed", caughtError);
      setFeedbackImprovement(feedbackEntry.improvement);
      setIsFeedbackSent(false);
      setFeedbackStatusMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Insert failed: Feedback database is unavailable.",
      );
    } finally {
      setIsFeedbackSaving(false);
    }
  }

  function loadDemoHand(demo = demoHands[0]) {
    setSelectedDemoId(demo.id);
    setHandHistory(demo.hand);
    setReport(null);
    setError("");
    setReviewLookupMessage("");
    trackDemoSelected(demo.id);
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-[900px] px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            AI Hand Review
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Analyze Your Poker Hand
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Try a built-in demo hand, or paste your own complete hand history.
          </p>
        </div>

        <PlayerMemoryCard reviews={memoryReviews} />

        <Card className="mt-7 p-5 md:p-6">
          <form onSubmit={handleAnalyze}>
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Try Demo Hand</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Start instantly with a realistic poker spot. No platform account required.
                  </p>
                </div>
                <span className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
                  10 sec demo
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-5">
                {demoHands.map((demo) => {
                  const isSelected = selectedDemoId === demo.id;

                  return (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => {
                        loadDemoHand(demo);
                      }}
                      className={[
                        "rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5",
                        isSelected
                          ? "border-primary/55 bg-primary/10 shadow-[0_0_28px_rgba(59,201,255,0.14)]"
                          : "border-slate-800 bg-slate-950/46 hover:border-primary/30",
                      ].join(" ")}
                      aria-pressed={isSelected}
                    >
                      <span className="block text-sm font-semibold text-slate-50">
                        {demo.title}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-primary">
                        {demo.spot}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-slate-500">
                        {demo.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="hand-history" className="text-sm font-medium text-slate-200">
                Hand history
              </label>
              <p className="text-xs text-slate-500" aria-live="polite">
                {characterCount.toLocaleString()} characters
              </p>
            </div>

            <Textarea
              id="hand-history"
              value={handHistory}
              onChange={(event) => setHandHistory(event.target.value)}
              placeholder="Paste a complete hand history here..."
              aria-describedby={error ? "review-error" : "character-counter"}
              className="mt-3 min-h-[260px]"
            />

            <div id="character-counter" className="sr-only">
              {characterCount} characters entered.
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={!canAnalyze}
                  className="min-w-36 shadow-[0_0_28px_rgba(59,201,255,0.18)] hover:-translate-y-0.5"
                >
                  Analyze
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => loadDemoHand()}
                >
                  Reset Demo
                </Button>
              </div>
              <p className="text-sm text-slate-500">No signup. One hand. One clear report.</p>
            </div>
          </form>
        </Card>

        {isLoading ? <LoadingState activeStep={activeStep} /> : null}
        {reviewLookupMessage ? <ReviewUnavailable message={reviewLookupMessage} /> : null}
        {error ? (
          <HandCompletionAssistant handHistory={handHistory} onTryDemo={() => loadDemoHand()} />
        ) : null}
        {report ? <ReportCards report={report} /> : null}
        {report && !isFeedbackDismissed ? (
          <FeedbackWidget
            improvement={feedbackImprovement}
            isSaving={isFeedbackSaving}
            isSent={isFeedbackSent}
            statusMessage={feedbackStatusMessage}
            usefulPart={feedbackUsefulPart}
            onDismiss={() => setIsFeedbackDismissed(true)}
            onImprovementChange={setFeedbackImprovement}
            onSubmit={handleFeedbackSubmit}
            onUsefulPartChange={setFeedbackUsefulPart}
          />
        ) : null}
      </section>
    </main>
  );
}

function ReviewUnavailable({ message }: { message: string }) {
  return (
    <Card className="fade-in mt-8 border-slate-800 bg-slate-950/48 p-5 md:p-6">
      <CardTitle>{message}</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        This review may have been created in another browser or cleared from local storage.
      </p>
    </Card>
  );
}

function FeedbackWidget({
  improvement,
  isSaving,
  isSent,
  statusMessage,
  usefulPart,
  onDismiss,
  onImprovementChange,
  onSubmit,
  onUsefulPartChange,
}: {
  improvement: string;
  isSaving: boolean;
  isSent: boolean;
  statusMessage: string;
  usefulPart: UsefulPart;
  onDismiss: () => void;
  onImprovementChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUsefulPartChange: (value: UsefulPart) => void;
}) {
  return (
    <Card className="fade-in mt-6 border-primary/20 bg-slate-950/58 p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Feedback</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Help shape Kevixo while the review is fresh.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs font-semibold text-slate-400 transition hover:border-slate-600 hover:text-slate-100"
          aria-label="Dismiss feedback"
        >
          Dismiss
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-5 grid gap-5">
        <fieldset>
          <legend className="text-sm font-medium text-slate-200">
            What was the most useful part of this review?
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {usefulPartOptions.map((option) => {
              const isSelected = usefulPart === option;

              return (
                <label
                  key={option}
                  className={[
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-sm font-semibold transition",
                    isSelected
                      ? "border-primary/55 bg-primary/10 text-primary shadow-[0_0_24px_rgba(59,201,255,0.12)]"
                      : "border-slate-800 bg-slate-950/48 text-slate-300 hover:border-primary/30",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="useful-part"
                    value={option}
                    checked={isSelected}
                    onChange={() => onUsefulPartChange(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="feedback-improvement" className="text-sm font-medium text-slate-200">
              What could be improved?
            </label>
            <p className="text-xs text-slate-500" aria-live="polite">
              {improvement.length}/500
            </p>
          </div>
          <Textarea
            id="feedback-improvement"
            value={improvement}
            onChange={(event) => onImprovementChange(event.target.value.slice(0, 500))}
            maxLength={500}
            placeholder="Optional: tell us what would make the coaching more useful..."
            className="mt-3 min-h-32 text-sm leading-6"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="min-w-40" disabled={isSaving || isSent}>
            {isSaving ? "Sending..." : "Send Feedback"}
          </Button>
          <p className="text-sm text-slate-500" role="status" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      </form>
    </Card>
  );
}

function PlayerMemoryCard({ reviews }: { reviews: PlayerMemoryEntry[] }) {
  const insights = getPlayerMemoryInsights(reviews);
  const latestReview = reviews[0];

  return (
    <Card className="mt-7 border-primary/20 bg-slate-950/58 p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Player Memory</CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Local coaching memory from your latest {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}.
          </p>
        </div>
        <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          No login
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {insights.map((insight) => (
          <div
            key={insight}
            className="rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-3 text-sm leading-6 text-slate-200"
          >
            {insight}
          </div>
        ))}
      </div>

      {latestReview ? (
        <div className="mt-5 grid gap-3 border-t border-slate-800 pt-5 text-sm md:grid-cols-3">
          <MemoryStat label="Latest Grade" value={latestReview.grade} />
          <MemoryStat label="Last Leak" value={latestReview.leak} />
          <MemoryStat label="Homework" value={latestReview.homework} />
        </div>
      ) : null}
    </Card>
  );
}

function MemoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 leading-6 text-slate-100">{value}</p>
    </div>
  );
}

function getResponseError(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

function formatFeedbackInsertError(payload: {
  error?: string;
  supabaseError?: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
}) {
  const supabaseError = payload.supabaseError;

  if (!supabaseError) {
    return payload.error ?? "Insert failed: Feedback database is unavailable.";
  }

  return [
    `Insert failed: ${supabaseError.message ?? payload.error ?? "Feedback database is unavailable."}`,
    supabaseError.code ? `Code: ${supabaseError.code}` : "",
    supabaseError.details ? `Details: ${supabaseError.details}` : "",
    supabaseError.hint ? `Hint: ${supabaseError.hint}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function LoadingState({ activeStep }: { activeStep: number }) {
  return (
    <Card className="fade-in mt-8 p-6">
      <CardTitle>Kevixo is thinking</CardTitle>
      <div className="mt-5 grid gap-3">
        {loadingSteps.map((step, index) => {
          const isDone = index < activeStep;
          const isActive = index === activeStep;

          return (
            <div
              key={step}
              className={[
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition duration-300",
                isActive
                  ? "border-primary/45 bg-primary/10 text-slate-50"
                  : "border-slate-800 bg-slate-950/46 text-slate-500",
              ].join(" ")}
            >
              <span className={isDone || isActive ? "text-primary" : "text-slate-700"}>
                {isDone ? "\u2713" : "\u2022"}
              </span>
              <span className="text-sm font-medium">{step}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function HandCompletionAssistant({
  handHistory,
  onTryDemo,
}: {
  handHistory: string;
  onTryDemo: () => void;
}) {
  const missingItems = getMissingHandDetails(handHistory);

  return (
    <Card className="fade-in mt-8 border-primary/25 bg-primary/5" id="review-error">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Let&apos;s complete this hand</CardTitle>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200" role="status">
            Kevixo needs a little more hand detail before it can give useful coaching.
            Add the missing pieces below and run the review again.
          </p>
        </div>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Platform-agnostic import
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {missingItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
          >
            <div className="flex items-start gap-3">
              <span
                className={[
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  item.isMissing
                    ? "border-primary/35 bg-primary/10 text-primary"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                ].join(" ")}
                aria-hidden="true"
              >
                {item.isMissing ? "+" : "✓"}
              </span>
              <div>
                <p className="font-semibold text-slate-50">{item.label}</p>
                <p className="mt-1 text-slate-400">{item.help}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
          <p className="text-sm font-semibold text-slate-50">Paste Hand History</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Works with complete text exports from any supported structure.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/32 p-4 opacity-80">
          <p className="text-sm font-semibold text-slate-50">Upload Screenshot</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Coming Soon</p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/32 p-4 opacity-80">
          <p className="text-sm font-semibold text-slate-50">Manual Hand Builder</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Coming Soon</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-500">
          You can keep editing this hand on the page. Nothing was rejected.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onTryDemo}>
            Try Demo Hand
          </Button>
          <Button asChild variant="secondary">
            <Link href="/import">Open Import Options</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function getMissingHandDetails(handHistory: string) {
  const normalized = handHistory.toLowerCase();
  const hasSeats = /\b(seat|hero|villain|button|small blind|big blind|sb|bb)\b/i.test(handHistory);
  const hasHoleCards = /\b(dealt to|hero cards?|hole cards?|[AKQJT2-9][cdhs]\s+[AKQJT2-9][cdhs])\b/i.test(handHistory);
  const hasBoard = normalized.includes("flop") || normalized.includes("turn") || normalized.includes("river");
  const hasBettingActions = /\b(bet|bets|call|calls|raise|raises|fold|folds|check|checks|posts?)\b/i.test(handHistory);
  const hasBetSizes = /[$€£]?\d+(?:\.\d+)?\s*(?:bb|BB)?/.test(handHistory);
  const hasStackSizes = /\(\$?\d+(?:\.\d+)?\)|stack|effective|seat\s+\d+:\s+.+\$?\d+/i.test(handHistory);

  return [
    {
      label: "Seats",
      help: "Player seats, blinds, button, and hero/villain positions.",
      isMissing: !hasSeats,
    },
    {
      label: "Hole cards",
      help: "Hero's two private cards.",
      isMissing: !hasHoleCards,
    },
    {
      label: "Board",
      help: "Flop, turn, river, or the final street available in the hand.",
      isMissing: !hasBoard,
    },
    {
      label: "Betting actions",
      help: "Checks, bets, calls, raises, folds, and posting blinds.",
      isMissing: !hasBettingActions,
    },
    {
      label: "Bet sizes",
      help: "The amount for each bet, call, raise, blind, or all-in.",
      isMissing: !hasBetSizes,
    },
    {
      label: "Stack sizes",
      help: "Starting stacks or effective stacks for the players in the hand.",
      isMissing: !hasStackSizes,
    },
  ];
}

function ReportCards({ report }: { report: CoachingReport }) {
  return (
    <section className="fade-in mt-10 grid gap-5" aria-label="Kevixo coaching report">
      <ResultCard title="Key Lesson">{report.keyLesson}</ResultCard>

      <Card>
        <CardTitle>Biggest Mistake</CardTitle>
        <p className="mt-3 text-xl font-semibold leading-8 text-slate-50">
          {report.biggestMistake}
        </p>
      </Card>

      <ResultCard title="Better Decision">{report.betterDecision}</ResultCard>
      <ResultCard title="Why">{report.why}</ResultCard>
      <ResultCard title="Evidence">{report.evidence}</ResultCard>

      <Card className="border-primary/25 bg-primary/5">
        <CardTitle>Next Time Checklist</CardTitle>
        <ul className="mt-4 grid gap-3">
          {report.nextTimeChecklist.map((item, index) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/48 p-4 text-sm leading-6 text-slate-200"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border-slate-700/80 bg-slate-950/28">
        <CardTitle>Coach Note</CardTitle>
        <p className="mt-3 text-lg leading-8 text-slate-100">{report.coachNote}</p>
      </Card>

      <Card className="border-primary/35 bg-primary/10">
        <CardTitle>Homework</CardTitle>
        <p className="mt-3 text-lg leading-8 text-slate-50">{report.homework}</p>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardTitle>Overall Grade</CardTitle>
          <div className="mt-4 inline-flex rounded-xl border border-primary/35 bg-primary/10 px-5 py-3 text-5xl font-semibold leading-none text-primary">
            {report.grade}
          </div>
        </Card>

        <Card>
          <CardTitle>Confidence</CardTitle>
          <p className="mt-4 text-3xl font-semibold text-slate-50">{report.confidence}%</p>
          <div className="mt-4 h-2 rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_24px_rgba(59,201,255,0.36)]"
              style={{ width: `${report.confidence}%` }}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Difficulty</CardTitle>
          <div className="mt-5 flex gap-1 text-2xl" aria-label={`${report.difficulty} out of 5`}>
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className={index < report.difficulty ? "text-primary" : "text-slate-700"}
              >
                {"\u2605"}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mt-3 text-lg leading-8 text-slate-200">{children}</p>
    </Card>
  );
}
