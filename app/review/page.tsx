"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  createReviewFeedbackStore,
  saveReviewFeedback,
  usefulPartOptions,
  type UsefulPart,
} from "@/lib/review-feedback";
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

const demoHands = [
  {
    id: "river-bluff-catch",
    title: "River Bluff Catch",
    spot: "CO vs BTN",
    detail: "Top pair faces a polar river bet.",
    hand: `PokerStars Hand #248190742233: Hold'em No Limit ($0.25/$0.50 USD)
Table 'Kevixo' 6-max Seat #3 is the button
Seat 1: Villain ($52.40)
Seat 3: Hero ($50.00)
Hero posts small blind $0.25
Villain posts big blind $0.50
*** HOLE CARDS ***
Dealt to Hero [As Qs]
Hero raises to $1.25
Villain calls $0.75
*** FLOP *** [Qh 8s 4d]
Hero bets $1.50
Villain calls $1.50
*** TURN *** [Qh 8s 4d] [9s]
Hero bets $4.50
Villain calls $4.50
*** RIVER *** [Qh 8s 4d 9s] [2c]
Hero checks
Villain bets $16.00
Hero calls $16.00`,
  },
  {
    id: "missed-cbet",
    title: "Missed C-Bet",
    spot: "BTN vs BB",
    detail: "Overcards and backdoors in position.",
    hand: `GGPoker Hand #90211844: Hold'em No Limit ($0.10/$0.25 USD)
Table 'Orion' 6-max Seat #5 is the button
Seat 2: Villain ($31.20)
Seat 5: Hero ($25.00)
Villain posts big blind $0.25
*** HOLE CARDS ***
Dealt to Hero [Ah Js]
Hero raises to $0.60
Villain calls $0.35
*** FLOP *** [Kd 7s 3h]
Villain checks
Hero checks
*** TURN *** [Kd 7s 3h] [Ts]
Villain bets $0.95
Hero calls $0.95
*** RIVER *** [Kd 7s 3h Ts] [2c]
Villain bets $2.75
Hero folds`,
  },
  {
    id: "turn-barrel",
    title: "Turn Barrel",
    spot: "SB vs BB",
    detail: "Strong draw chooses a big turn size.",
    hand: `PokerStars Hand #248190742991: Hold'em No Limit ($0.50/$1.00 USD)
Table 'North' 6-max Seat #1 is the small blind
Seat 1: Hero ($104.00)
Seat 2: Villain ($98.50)
Hero posts small blind $0.50
Villain posts big blind $1.00
*** HOLE CARDS ***
Dealt to Hero [Qs Js]
Hero raises to $3.00
Villain calls $2.00
*** FLOP *** [Ts 8s 2d]
Hero bets $2.50
Villain calls $2.50
*** TURN *** [Ts 8s 2d] [4c]
Hero bets $11.00
Villain calls $11.00
*** RIVER *** [Ts 8s 2d 4c] [Ah]
Hero bets $28.00
Villain folds`,
  },
  {
    id: "thin-value",
    title: "Thin Value Bet",
    spot: "HJ vs BB",
    detail: "Second pair considers river value.",
    hand: `GGPoker Hand #90211902: Hold'em No Limit ($0.25/$0.50 USD)
Table 'Vega' 6-max Seat #4 is the hijack
Seat 4: Hero ($50.00)
Seat 6: Villain ($46.80)
Villain posts big blind $0.50
*** HOLE CARDS ***
Dealt to Hero [Kc Qd]
Hero raises to $1.10
Villain calls $0.60
*** FLOP *** [Kh 9c 5s]
Villain checks
Hero bets $1.25
Villain calls $1.25
*** TURN *** [Kh 9c 5s] [9d]
Villain checks
Hero checks
*** RIVER *** [Kh 9c 5s 9d] [3s]
Villain checks
Hero bets $3.50
Villain calls $3.50`,
  },
  {
    id: "three-bet-pot",
    title: "3-Bet Pot",
    spot: "CO vs SB",
    detail: "Overpair faces turn pressure.",
    hand: `PokerStars Hand #248190743551: Hold'em No Limit ($1.00/$2.00 USD)
Table 'Atlas' 6-max Seat #1 is the small blind
Seat 1: Villain ($203.00)
Seat 4: Hero ($200.00)
Villain posts small blind $1.00
Seat 2 posts big blind $2.00
*** HOLE CARDS ***
Dealt to Hero [Ad Ac]
Hero raises to $5.00
Villain raises to $18.00
Hero calls $13.00
*** FLOP *** [Jh 7d 4c]
Villain bets $12.00
Hero calls $12.00
*** TURN *** [Jh 7d 4c] [Ts]
Villain bets $42.00
Hero calls $42.00
*** RIVER *** [Jh 7d 4c Ts] [8s]
Villain checks
Hero checks`,
  },
];

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
  const [feedbackUsefulPart, setFeedbackUsefulPart] = useState<UsefulPart>("Biggest Mistake");
  const [feedbackImprovement, setFeedbackImprovement] = useState("");
  const [isFeedbackDismissed, setIsFeedbackDismissed] = useState(false);
  const [isFeedbackSent, setIsFeedbackSent] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMemoryReviews(createPlayerMemory(window.localStorage).read());
      const importedHand = readImportedHandModel(window.localStorage);

      if (importedHand) {
        setHandHistory(importedHand);
        setSelectedDemoId("");
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

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

  function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!report) {
      return;
    }

    const feedbackEntry = buildReviewFeedbackEntry({
      usefulPart: feedbackUsefulPart,
      improvement: feedbackImprovement,
      grade: report.grade,
    });

    saveReviewFeedback(createReviewFeedbackStore(window.localStorage), feedbackEntry);
    trackFeedback({
      usefulPart: feedbackEntry.usefulPart,
      hasImprovementText: feedbackEntry.improvement.length > 0,
    });
    console.log("Kevixo review feedback", feedbackEntry);
    setFeedbackImprovement(feedbackEntry.improvement);
    setIsFeedbackSent(true);
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
                    Start instantly with a realistic poker spot. No PokerStars or GGPoker
                    account required.
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
                        setSelectedDemoId(demo.id);
                        setHandHistory(demo.hand);
                        setReport(null);
                        setError("");
                        trackDemoSelected(demo.id);
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
              placeholder="Paste your PokerStars or GGPoker hand history here..."
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
                  onClick={() => {
                    setSelectedDemoId(demoHands[0].id);
                    setHandHistory(demoHands[0].hand);
                    setReport(null);
                    setError("");
                  }}
                >
                  Reset Demo
                </Button>
              </div>
              <p className="text-sm text-slate-500">No signup. One hand. One clear report.</p>
            </div>
          </form>
        </Card>

        {isLoading ? <LoadingState activeStep={activeStep} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {report ? <ReportCards report={report} /> : null}
        {report && !isFeedbackDismissed ? (
          <FeedbackWidget
            improvement={feedbackImprovement}
            isSent={isFeedbackSent}
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

function FeedbackWidget({
  improvement,
  isSent,
  usefulPart,
  onDismiss,
  onImprovementChange,
  onSubmit,
  onUsefulPartChange,
}: {
  improvement: string;
  isSent: boolean;
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
          <Button type="submit" className="min-w-40">
            Send Feedback
          </Button>
          <p className="text-sm text-slate-500" role="status" aria-live="polite">
            {isSent
              ? "Feedback saved locally. Thank you."
              : "Stored locally for now. No account required."}
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

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="fade-in mt-8 border-red-500/25 bg-red-950/10">
      <CardTitle className="text-red-300">Review blocked</CardTitle>
      <p id="review-error" className="mt-3 text-base leading-7 text-red-100" role="alert">
        {message}
      </p>
    </Card>
  );
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
