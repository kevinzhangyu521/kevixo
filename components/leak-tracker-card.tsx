"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";

type Pattern = { theme: string; name: string; explanation: string; checkNext: string; lastSeen: string; supportingReviews: Array<{ reviewId: string; title: string; createdAt: string }> };
type Tracker = { eligibleReviewCount: number; patterns: Pattern[] };

export function LeakTrackerCard() {
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;
      const response = await fetch("/api/leak-tracker", { headers });
      const payload = await response.json() as { ok: boolean; tracker?: Tracker; error?: string };
      if (!response.ok || !payload.ok || !payload.tracker) throw new Error(payload.error ?? "Your review patterns could not be loaded.");
      setTracker(payload.tracker);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your review patterns could not be loaded."); }
  }, []);
  useEffect(() => { const frameId = window.requestAnimationFrame(() => { void load(); }); return () => window.cancelAnimationFrame(frameId); }, [load]);
  if (error) return <Card className="mt-5 p-5 md:p-6"><CardTitle>Personal review patterns</CardTitle><p className="mt-3 text-sm text-slate-300">{error}</p><button type="button" onClick={() => void load()} className="mt-4 text-sm font-semibold text-primary">Try again</button></Card>;
  if (!tracker) return null;
  if (tracker.eligibleReviewCount < 5) return <Card className="mt-5 border-primary/25 bg-primary/5 p-5 md:p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Personal review patterns</p><p className="mt-3 text-lg text-slate-100">You need more hand reviews before Kevixo can identify a repeated pattern.</p><p className="mt-2 text-sm text-slate-400">{tracker.eligibleReviewCount} of 5 qualifying hand reviews saved.</p></Card>;
  if (tracker.patterns.length === 0) return <Card className="mt-5 p-5 md:p-6"><CardTitle>Personal review patterns</CardTitle><p className="mt-3 text-sm leading-6 text-slate-400">You have enough qualifying hand reviews, but Kevixo has not found a repeated, clearly classified decision theme yet.</p></Card>;
  return <Card className="mt-5 border-primary/25 bg-primary/5 p-5 md:p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Repeated focus</p>{tracker.patterns.map((pattern) => <div key={pattern.theme} className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/48 p-4"><CardTitle>{pattern.name}</CardTitle><p className="mt-3 text-sm leading-6 text-slate-300">{pattern.explanation}</p><p className="mt-3 text-sm text-slate-400">Supporting reviews: {pattern.supportingReviews.length} · Last seen: {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(pattern.lastSeen))}</p><p className="mt-3 text-sm leading-6 text-slate-200"><span className="font-semibold">What to check next:</span> {pattern.checkNext}</p><div className="mt-4 flex flex-wrap gap-2">{pattern.supportingReviews.map((review) => <Button key={review.reviewId} asChild variant="secondary"><Link href={`/review?reviewId=${encodeURIComponent(review.reviewId)}`}>View supporting hand</Link></Button>)}</div></div>)}</Card>;
}
