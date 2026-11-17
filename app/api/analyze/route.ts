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
import { demoHands } from "@/lib/demo-hands";
import { classifyDecisionTheme } from "@/lib/leak-tracker";
import {
  beginAnalysisQuota,
  confirmAnalysisQuota,
  createAnalysisInputFingerprint,
  createSupabaseAnalysisQuotaStore,
  isAnalysisQuotaEnabled,
  releaseAnalysisQuota,
  type AnalysisQuotaStore,
} from "@/lib/analysis-quota";
import { isCoachUser } from "@/lib/subscription";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    handHistory?: string;
    question?: string;
    report?: CoachingReport;
    visitorId?: string;
    requestId?: string;
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

  const isDemo = isDemoHand(normalizedHandHistory);
  const quotaEnabled = isAnalysisQuotaEnabled(process.env.ANALYSIS_QUOTA_ENABLED);
  let userId: string | undefined;
  let quota: { requestId: string; fingerprint: string; store: AnalysisQuotaStore } | undefined;

  if (quotaEnabled) {
    try {
      userId = (await getUserFromRequest(request))?.id;
    } catch (error) {
      console.error("[Kevixo analysis auth lookup failed]", { error: getErrorDetails(error) });
      return NextResponse.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
    }

    if (userId && !isDemo) {
      let isCoach: boolean;
      try {
        isCoach = await isCoachUser(userId);
      } catch (error) {
        console.error("[Kevixo analysis entitlement lookup failed]", { userId, error: getErrorDetails(error) });
        return NextResponse.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
      }

      const requestId = body.requestId?.trim();
      if (!requestId || !isValidRequestId(requestId)) {
        return NextResponse.json({ error: "A valid analysis request ID is required." }, { status: 400 });
      }

      const fingerprint = createAnalysisInputFingerprint(normalizedHandHistory);
      const store = createSupabaseAnalysisQuotaStore();
      let reservation;
      try {
        reservation = await beginAnalysisQuota({
          userId,
          requestId,
          fingerprint,
          isCoach,
          isDemo: false,
          isFollowUp: false,
        }, store);
      } catch (error) {
        console.error("[Kevixo analysis quota reservation failed]", { userId, requestId, error: getErrorDetails(error) });
        return NextResponse.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
      }

      if (reservation.kind === "quota_exceeded") {
        return NextResponse.json(
          { error: "You have used your 10 Free analyses for this UTC month." },
          { status: 429 },
        );
      }
      if (reservation.kind === "in_progress") {
        return NextResponse.json(
          { error: "This analysis is still in progress. Please retry shortly." },
          { status: 409 },
        );
      }
      if (reservation.kind === "replayed") {
        if (!isSuccessfulAnalysisResult(reservation.result)) {
          return NextResponse.json({ error: "Saved analysis result is unavailable." }, { status: 503 });
        }
        return NextResponse.json(reservation.result);
      }

      quota = { requestId, fingerprint, store };
    }
  }

  const result = await analyzeHandHistory(normalizedHandHistory);

  if (!result.ok) {
    if (quota) await safelyReleaseQuota(quota, userId);
    return NextResponse.json(
      { error: result.error },
      { status: 422 },
    );
  }

  if (quota) {
    try {
      const confirmation = await confirmAnalysisQuota(
        quota.requestId,
        quota.fingerprint,
        result.report.reviewId,
        result,
        quota.store,
      );
      if (confirmation.status !== "succeeded") {
        return NextResponse.json({ error: "Analysis could not be confirmed. Please retry." }, { status: 409 });
      }
    } catch (error) {
      console.error("[Kevixo analysis quota confirmation failed]", {
        userId,
        requestId: quota.requestId,
        error: getErrorDetails(error),
      });
      return NextResponse.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
    }
  }

  if (!quotaEnabled) {
    try {
      userId = (await getUserFromRequest(request))?.id;
    } catch (error) {
      console.warn("[Kevixo review persistence auth lookup failed]", {
        reviewId: result.report.reviewId,
        error: getErrorDetails(error),
      });
    }
  }

  try {
    await insertHandReview({
      handHistory: normalizedHandHistory,
      report: result.report,
      userAgent: request.headers.get("user-agent") ?? undefined,
      userId,
      reviewSource: isDemo ? "demo" : parsedHand.isCompleteEnough ? "hand_history" : null,
      decisionTheme: classifyDecisionTheme(result.report.leak),
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

function isDemoHand(handHistory: string) {
  return demoHands.some((demo) => parseHandHistory(demo.hand).normalizedText === handHistory);
}

function isValidRequestId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isSuccessfulAnalysisResult(value: unknown): value is { ok: true; report: CoachingReport } {
  if (!value || typeof value !== "object") return false;
  const result = value as { ok?: unknown; report?: { reviewId?: unknown } };
  return result.ok === true && typeof result.report?.reviewId === "string";
}

async function safelyReleaseQuota(
  quota: { requestId: string; fingerprint: string; store: AnalysisQuotaStore },
  userId: string | undefined,
) {
  try {
    await releaseAnalysisQuota(quota.requestId, quota.fingerprint, quota.store);
  } catch (error) {
    console.error("[Kevixo analysis quota release failed]", {
      userId,
      requestId: quota.requestId,
      error: getErrorDetails(error),
    });
  }
}
