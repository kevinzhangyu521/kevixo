import { NextResponse } from "next/server";
import { getDailyChallenge } from "@/lib/daily-challenge";
import { saveDailyChallengeAttempt, listDailyChallengeAttempts, saveDailyChallengeFeedback } from "@/lib/daily-challenge-attempts";
import { buildDailyChallengeAttempt } from "@/lib/daily-challenge-history";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in to view your practice history." }, { status: 401 });
  try { return NextResponse.json({ ok: true, attempts: await listDailyChallengeAttempts(user.id) }); }
  catch { return NextResponse.json({ ok: false, error: "Your practice history could not be loaded right now." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in to save your practice." }, { status: 401 });
  try {
    const body = await request.json() as { challengeId?: string; challengeVersion?: string; challengeDate?: string; selectedOptionId?: string };
    const today = getDailyChallenge();
    if (body.challengeDate !== today.dateKey) throw new Error("Today's challenge can only be completed today.");
    const attempt = await saveDailyChallengeAttempt(user.id, buildDailyChallengeAttempt({
      challengeId: body.challengeId ?? "", challengeVersion: body.challengeVersion ?? "", challengeDate: body.challengeDate ?? "", selectedOptionId: body.selectedOptionId ?? "",
    }));
    return NextResponse.json({ ok: true, attempt });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Your practice could not be saved." }, { status: 400 }); }
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in to save feedback." }, { status: 401 });
  try {
    const body = await request.json() as { attemptId?: string; helpful?: unknown };
    if (!body.attemptId || typeof body.helpful !== "boolean") throw new Error("Please choose whether the explanation was useful.");
    await saveDailyChallengeFeedback(user.id, body.attemptId, body.helpful);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Your feedback could not be saved." }, { status: 400 }); }
}
