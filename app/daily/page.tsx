"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  completeDailyChallenge,
  createInitialProgress,
  getDailyChallenge,
  type DailyChallengeProgress,
  type DailyCompletion,
} from "@/lib/daily-challenge";
import { saveGrowthEvent } from "@/lib/growth-client";

const progressKey = "kevixo.dailyChallenge.progress.v1";
const completionKey = "kevixo.dailyChallenge.completions.v1";

export default function DailyChallengePage() {
  const challenge = useMemo(() => getDailyChallenge(), []);
  const [progress, setProgress] = useState<DailyChallengeProgress>(createInitialProgress);
  const [completion, setCompletion] = useState<DailyCompletion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedProgress = readProgress();
      const storedCompletion = readCompletion(challenge.dateKey);

      setProgress(storedProgress);

      if (storedCompletion) {
        setCompletion(storedCompletion);
        setSelectedOptionId(storedCompletion.selectedOptionId);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [challenge.dateKey]);

  const selectedOption = challenge.options.find((option) => option.id === selectedOptionId);
  const isCompletedToday = Boolean(completion);

  function handleSelect(optionId: string) {
    if (isCompletedToday) {
      return;
    }

    const nextCompletion: DailyCompletion = {
      dateKey: challenge.dateKey,
      challengeId: challenge.id,
      selectedOptionId: optionId,
      completedAt: new Date().toISOString(),
    };
    const nextProgress = completeDailyChallenge(progress, nextCompletion);

    setSelectedOptionId(optionId);
    setCompletion(nextCompletion);
    setProgress(nextProgress);
    writeCompletion(nextCompletion);
    writeProgress(nextProgress);
    void saveGrowthEvent("daily_challenge_attempted", challenge.id);
    void saveGrowthEvent("daily_challenge_completed", challenge.id);
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze Free" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Daily Challenge
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              One decision. One lesson.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
              Practice a real poker spot each day, choose your action, then compare it with a short Kevixo coaching note.
            </p>

            <Card className="mt-8 p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Today&apos;s Spot</CardTitle>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
                    {challenge.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{challenge.situation}</p>
                </div>
                <span className="w-fit rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-400">
                  {formatDisplayDate(challenge.dateKey)}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoPanel label="Board" value={challenge.board.join(" ")} />
                <InfoPanel label="Position" value={challenge.position} />
              </div>

              <div className="mt-6 grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Choose your action
                </p>
                {challenge.options.map((option) => {
                  const isSelected = option.id === selectedOptionId;
                  const isBest = option.id === challenge.bestOptionId;
                  const completedClass = isCompletedToday
                    ? isBest
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100"
                      : isSelected
                        ? "border-amber-300/45 bg-amber-300/10 text-amber-100"
                        : "border-slate-800 bg-slate-950/36 text-slate-400"
                    : "border-slate-800 bg-slate-950/48 text-slate-100 hover:border-primary/45 hover:bg-primary/10";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      disabled={isCompletedToday}
                      className={[
                        "rounded-2xl border p-4 text-left text-sm font-semibold transition duration-200",
                        completedClass,
                      ].join(" ")}
                    >
                      <span>{option.label}</span>
                      {isCompletedToday && isBest ? (
                        <span className="ml-2 text-xs text-emerald-200">Best choice</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {selectedOption ? (
                <ExplanationCard
                  isBestChoice={selectedOption.id === challenge.bestOptionId}
                  explanation={challenge.explanation}
                  takeaway={challenge.takeaway}
                  completedToday={isCompletedToday}
                />
              ) : null}
            </Card>
          </div>

          <aside className="grid gap-5">
            <Card className="p-5 md:p-6">
              <CardTitle>Learning Streak</CardTitle>
              <div className="mt-5 grid gap-3">
                <StreakStat label="Current streak" value={`${progress.currentStreak} day${progress.currentStreak === 1 ? "" : "s"}`} />
                <StreakStat label="Longest streak" value={`${progress.longestStreak} day${progress.longestStreak === 1 ? "" : "s"}`} />
                <StreakStat
                  label="Last completed day"
                  value={progress.lastCompletedDay ? formatDisplayDate(progress.lastCompletedDay) : "Not started yet"}
                />
              </div>
            </Card>

            <Card className="p-5 md:p-6">
              <CardTitle>{isCompletedToday ? "Completed Today" : "Build the habit"}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {isCompletedToday
                  ? "Nice work. Your explanation is saved for today. Keep the momentum going by reviewing a full hand next."
                  : "Pick the action you would take. Kevixo will reveal the coaching note immediately after your choice."}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild>
                  <Link href="/review">Review another hand</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/profile">View Player Profile</Link>
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/48 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold tracking-tight text-slate-50">{value}</p>
    </div>
  );
}

function ExplanationCard({
  isBestChoice,
  explanation,
  takeaway,
  completedToday,
}: {
  isBestChoice: boolean;
  explanation: string;
  takeaway: string;
  completedToday: boolean;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        AI Explanation
      </p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-50">
        {isBestChoice ? "Strong decision." : "Good spot to learn from."}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{explanation}</p>
      <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300">
        {takeaway}
      </p>
      {completedToday ? (
        <p className="mt-4 text-xs font-semibold text-slate-500">
          Today&apos;s completion has been added to your streak.
        </p>
      ) : null}
    </div>
  );
}

function StreakStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/48 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">{value}</p>
    </div>
  );
}

function readProgress(): DailyChallengeProgress {
  try {
    const rawValue = window.localStorage.getItem(progressKey);

    if (!rawValue) {
      return createInitialProgress();
    }

    const parsed = JSON.parse(rawValue) as Partial<DailyChallengeProgress>;

    return {
      currentStreak: typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
      longestStreak: typeof parsed.longestStreak === "number" ? parsed.longestStreak : 0,
      lastCompletedDay: typeof parsed.lastCompletedDay === "string" ? parsed.lastCompletedDay : null,
      completedDays: Array.isArray(parsed.completedDays)
        ? parsed.completedDays.filter((day): day is string => typeof day === "string")
        : [],
    };
  } catch {
    return createInitialProgress();
  }
}

function writeProgress(progress: DailyChallengeProgress) {
  window.localStorage.setItem(progressKey, JSON.stringify(progress));
}

function readCompletion(dateKey: string): DailyCompletion | null {
  try {
    const completions = readCompletions();
    return completions.find((entry) => entry.dateKey === dateKey) ?? null;
  } catch {
    return null;
  }
}

function writeCompletion(completion: DailyCompletion) {
  const completions = readCompletions().filter((entry) => entry.dateKey !== completion.dateKey);
  window.localStorage.setItem(completionKey, JSON.stringify([...completions, completion].slice(-60)));
}

function readCompletions(): DailyCompletion[] {
  const rawValue = window.localStorage.getItem(completionKey);

  if (!rawValue) {
    return [];
  }

  const parsed = JSON.parse(rawValue) as DailyCompletion[];

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (entry): entry is DailyCompletion =>
      typeof entry?.dateKey === "string" &&
      typeof entry.challengeId === "string" &&
      typeof entry.selectedOptionId === "string" &&
      typeof entry.completedAt === "string",
  );
}

function formatDisplayDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}
