import { NextResponse } from "next/server";
import {
  analyzeHandHistory,
  answerFollowUpQuestion,
  type CoachingReport,
} from "@/services/ai";
import { insertHandReview } from "@/lib/supabase-hand-reviews";
import { parseHandHistory } from "@/lib/hand-history/parser";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    handHistory?: string;
    question?: string;
    report?: CoachingReport;
  };
  const handHistory = body.handHistory?.trim();

  if (!handHistory) {
    return NextResponse.json(
      { error: "Hand history is required." },
      { status: 400 },
    );
  }

  const parsedHand = parseHandHistory(handHistory);
  const normalizedHandHistory = parsedHand.normalizedText || handHistory;

  if (body.question && body.report) {
    const followUp = await answerFollowUpQuestion({
      handHistory: normalizedHandHistory,
      report: body.report,
      question: body.question,
    });

    if (!followUp.ok) {
      return NextResponse.json(
        { error: followUp.error },
        { status: 400 },
      );
    }

    return NextResponse.json(followUp);
  }

  const result = await analyzeHandHistory(normalizedHandHistory);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 422 },
    );
  }

  try {
    const user = await getUserFromRequest(request);
    await insertHandReview({
      handHistory: normalizedHandHistory,
      report: result.report,
      userAgent: request.headers.get("user-agent") ?? undefined,
      userId: user?.id,
    });
  } catch (error) {
    console.error(
      "[Kevixo hand review persistence failed]",
      error instanceof Error ? error.message : error,
    );
  }

  return NextResponse.json(result);
}
