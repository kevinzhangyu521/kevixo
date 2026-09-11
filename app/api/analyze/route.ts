import { NextResponse } from "next/server";
import {
  analyzeHandHistory,
  answerFollowUpQuestion,
  type CoachingReport,
} from "@/services/ai";
import { insertHandReview } from "@/lib/supabase-hand-reviews";
import { parseHandHistory } from "@/lib/hand-history/parser";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { insertGrowthEvent } from "@/lib/growth-events";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    handHistory?: string;
    question?: string;
    report?: CoachingReport;
    visitorId?: string;
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

  let userId: string | undefined;

  try {
    userId = (await getUserFromRequest(request))?.id;
  } catch (error) {
    console.warn("[Kevixo review persistence auth lookup failed]", {
      reviewId: result.report.reviewId,
      error: getErrorDetails(error),
    });
  }

  try {
    await insertHandReview({
      handHistory: normalizedHandHistory,
      report: result.report,
      userAgent: request.headers.get("user-agent") ?? undefined,
      userId,
    });
    await savePersistenceEvent({
      eventType: "review_persisted",
      request,
      reviewId: result.report.reviewId,
      userId,
      visitorId: body.visitorId,
    });
  } catch (error) {
    const errorDetails = getErrorDetails(error);
    console.error("[Kevixo hand review persistence failed]", {
      eventType: "review_persist_failed",
      reviewId: result.report.reviewId,
      visitorId: body.visitorId,
      userId,
      error: errorDetails,
    });
    await savePersistenceEvent({
      eventType: "review_persist_failed",
      request,
      reviewId: result.report.reviewId,
      userId,
      visitorId: body.visitorId,
    });
  }

  return NextResponse.json(result);
}

async function savePersistenceEvent({
  eventType,
  request,
  reviewId,
  userId,
  visitorId,
}: {
  eventType: "review_persisted" | "review_persist_failed";
  request: Request;
  reviewId: string;
  userId?: string;
  visitorId?: string;
}) {
  try {
    await insertGrowthEvent({
      eventType,
      reviewId,
      visitorId: sanitizeVisitorId(visitorId),
      userId,
      sourcePage: "/review",
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  } catch (error) {
    console.error("[Kevixo review persistence event failed]", {
      eventType,
      reviewId,
      userId,
      error: getErrorDetails(error),
    });
  }
}

function sanitizeVisitorId(visitorId: string | undefined) {
  const trimmedVisitorId = visitorId?.trim();

  return trimmedVisitorId && trimmedVisitorId.length <= 128 ? trimmedVisitorId : undefined;
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { name: "UnknownError", message: String(error) };
}
