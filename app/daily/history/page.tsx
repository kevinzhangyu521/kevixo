"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";

type Attempt = { id: string; challengeDate: string; selectedOptionId: string; completedAt: string; challenge: { title: string; options: Array<{ id: string; label: string }>; bestOptionId: string; explanation: string } };

export default function DailyHistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { void (async () => { try { const response = await fetch("/api/daily-challenge", { headers: await getAuthHeaders() }); const payload = await response.json() as { ok: boolean; attempts?: Attempt[]; error?: string }; if (!response.ok || !payload.ok) throw new Error(payload.error); setAttempts(payload.attempts ?? []); } catch (error) { setMessage(error instanceof Error ? error.message : "Your practice history could not be loaded."); } })(); }, []);
  return <main className="min-h-screen bg-background"><SiteHeader ctaLabel="Analyze Free" ctaHref="/review" /><section className="mx-auto w-full max-w-3xl px-5 py-10"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Daily Challenge</p><h1 className="mt-3 text-4xl font-semibold text-slate-50">Practice history</h1>{message ? <Card className="mt-8 p-5 text-slate-300">{message} <Link className="text-primary" href="/login">Sign in</Link> to view account history.</Card> : null}{attempts?.length === 0 ? <Card className="mt-8 p-5 text-slate-300">No saved practice yet. <Link className="text-primary" href="/daily">Try today&apos;s challenge.</Link></Card> : null}<div className="mt-8 grid gap-4">{attempts?.map((attempt) => { const selected = attempt.challenge.options.find((option) => option.id === attempt.selectedOptionId)?.label ?? "Your answer"; const best = attempt.challenge.options.find((option) => option.id === attempt.challenge.bestOptionId)?.label ?? "Recommended action"; return <Card key={attempt.id} className="p-5"><CardTitle>{attempt.challenge.title}</CardTitle><p className="mt-2 text-sm text-slate-500">{attempt.challengeDate} · Completed {new Date(attempt.completedAt).toLocaleString("en")}</p><p className="mt-4 text-sm text-slate-300">Your choice: {selected}</p><p className="mt-2 text-sm text-emerald-200">Recommended action: {best}</p><p className="mt-4 text-sm leading-6 text-slate-400">{attempt.challenge.explanation}</p></Card>; })}</div></section></main>;
}
