"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth-client";

type Training = { source: "repeated_theme" | "latest_review" | "general"; title: string; reason: string; action: string; reviewId?: string };
type TrainingHistoryRecord = { id: string; training_key: string; title: string; action: string; completed_at: string; helpful?: boolean | null };
type Payload = { ok: boolean; training?: Training; trainingKey?: string; records?: TrainingHistoryRecord[]; error?: string };

const sourceLabel: Record<Training["source"], string> = { repeated_theme: "Based on your reviewed hands", latest_review: "Based on your latest review", general: "General practice" };

export function TrainingCenterCard() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [status, setStatus] = useState<"loading" | "guest" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) { setStatus("guest"); return; }
      const response = await fetch("/api/training", { headers });
      const data = await response.json() as Payload;
      if (!response.ok || !data.ok || !data.training || !data.trainingKey) throw new Error(data.error ?? "Your training could not be loaded.");
      setPayload(data); setStatus("ready"); setMessage("");
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Your training could not be loaded."); }
  }, []);
  useEffect(() => { const frameId = window.requestAnimationFrame(() => { void load(); }); return () => window.cancelAnimationFrame(frameId); }, [load]);

  async function save(method: "POST" | "PUT", body: globalThis.Record<string, unknown>) {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/training", { method, headers: { "Content-Type": "application/json", ...await getAuthHeaders() }, body: JSON.stringify(body) });
      const data = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Your training could not be saved.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Your training could not be saved."); }
    finally { setSaving(false); }
  }

  if (status === "loading") return <Card className="mt-8 p-5 md:p-6"><CardTitle>Loading your next training</CardTitle></Card>;
  if (status === "guest") return <Card className="mt-8 border-primary/25 bg-primary/5 p-5 md:p-6"><CardTitle>My Next Training</CardTitle><p className="mt-3 text-sm leading-6 text-slate-300">Sign in to save training, feedback, and history across devices.</p><div className="mt-5"><Button asChild><Link href="/login?redirect=/progress">Sign in to continue</Link></Button></div></Card>;
  if (status === "error") return <Card className="mt-8 border-rose-400/30 p-5 md:p-6"><CardTitle>Training unavailable</CardTitle><p className="mt-3 text-sm text-slate-300">{message}</p><div className="mt-5"><Button type="button" variant="secondary" onClick={() => void load()}>Try again</Button></div></Card>;

  const training = payload!.training!; const key = payload!.trainingKey!; const records = payload!.records ?? []; const current = records.find((record) => record.training_key === key);
  return <Card className="mt-8 border-primary/35 bg-primary/10 p-5 md:p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">My Next Training</p>
    <CardTitle className="mt-3">{training.title}</CardTitle>
    <p className="mt-2 text-sm font-medium text-primary">{sourceLabel[training.source]}</p>
    <p className="mt-3 text-sm leading-6 text-slate-300">{training.reason}</p>
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/48 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next action</p><p className="mt-2 text-sm leading-6 text-slate-100">{training.action}</p></div>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      {training.reviewId ? <Button asChild variant="secondary"><Link href={`/review?reviewId=${encodeURIComponent(training.reviewId)}`}>Open supporting review</Link></Button> : null}
      {current ? <span className="text-sm font-medium text-emerald-300">Completed {formatDate(current.completed_at)}</span> : <Button type="button" disabled={saving} onClick={() => void save("POST", { trainingKey: key })}>{saving ? "Saving..." : "Mark as completed"}</Button>}
    </div>
    {current ? <div className="mt-5 border-t border-slate-800 pt-5"><p className="text-sm text-slate-300">Was this useful?</p><div className="mt-3 flex gap-2"><Button type="button" variant={current.helpful === true ? "primary" : "secondary"} disabled={saving} onClick={() => void save("PUT", { trainingKey: key, helpful: true })}>Yes</Button><Button type="button" variant={current.helpful === false ? "primary" : "secondary"} disabled={saving} onClick={() => void save("PUT", { trainingKey: key, helpful: false })}>No</Button></div></div> : null}
    {message ? <p className="mt-4 text-sm text-rose-300">{message} <button type="button" className="underline" onClick={() => void load()}>Try again</button></p> : null}
    <div className="mt-6 border-t border-slate-800 pt-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent training</p>{records.length ? <ul className="mt-3 grid gap-2">{records.slice(0, 5).map((record) => <li key={record.id} className="rounded-xl bg-slate-950/48 p-3 text-sm text-slate-300"><span className="font-medium text-slate-100">{record.title}</span><span className="ml-2 text-slate-500">{formatDate(record.completed_at)}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-400">Complete a training step to build your history.</p>}</div>
  </Card>;
}
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)); }