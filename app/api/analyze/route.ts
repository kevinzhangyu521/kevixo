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
import {
  anonymousAnalysisLimit,
  createAnonymousAnalysisIdentity,
} from "@/lib/anonymous-analysis-identity";
import { createSupabaseAnonymousAnalysisQuotaStore } from "@/lib/anonymous-analysis-quota";

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
  let anonymousSetCookie: string | undefined;

  if (quotaEnabled) {
    try {
      userId = (await getUserFromRequest(request))?.id;
    } catch (error) {
      console.error("[Kevixo analysis auth lookup failed]", { error: getErrorDetails(error) });
      return NextResponse.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
    }

    if (!isDemo) {
      const requestId = body.requestId?.trim();
      if (!requestId || !isValidRequestId(requestId)) {
        return NextResponse.json({ error: "A valid analysis request ID is required." }, { status: 400 });
      }

      const fingerprint = createAnalysisInputFingerprint(normalizedHandHistory);
      let isCoach = false;
      let quotaSubjectId: string;
      let limit: number | undefined;
      let store: AnalysisQuotaStore;

      if (userId) {
        try {
          isCoach = await isCoachUser(userId);
        } catch (error) {
          console.error("[Kevixo analysis entitlement lookup failed]", { userId, error: getErrorDetails(error) });
          return NextResponse.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
        }
        quotaSubjectId = userId;
        store = createSupabaseAnalysisQuotaStore();
      } else {
        try {
          const identity = createAnonymousAnalysisIdentity({
            cookieHeader: request.headers.get("cookie"),
            visitorId: body.visitorId,
            secret: process.env.ANALYSIS_ANONYMOUS_COOKIE_SECRET,
          });
          quotaSubjectId = identity.subjectHash;
          anonymousSetCookie = identity.setCookie;
          limit = anonymousAnalysisLimit;
          store = createSupabaseAnonymousAnalysisQuotaStore();
        } catch (error) {
          console.error("[Kevixo anonymous analysis identity failed]", { error: getErrorDetails(error) });
          return NextResponse.json({ error: "Analysis is temporarily unavailable." }, { status: 503 });
        }
      }

      let reservation;
      try {
        reservation = await beginAnalysisQuota({
          quotaSubjectId,
          requestId,
          fingerprint,
          isCoach,
          isDemo: false,
          isFollowUp: false,
          limit,
        }, store);
      } catch (error) {
        console.error("[Kevixo analysis quota reservation failed]", { userId, requestId, error: getErrorDetails(error) });
        return jsonWithAnonymousCookie({ error: "Analysis is temporarily unavailable." }, 503, anonymousSetCookie);
      }

      if (reservation.kind === "quota_exceeded") {
        return userId
          ? jsonWithAnonymousCookie(
              { error: "You have used your 10 Free analyses for this UTC month." },
              429,
              anonymousSetCookie,
            )
          : jsonWithAnonymousCookie(
              {
                error: "Your free guest analysis has been used. Sign up or log in to continue.",
                code: "anonymous_analysis_limit_reached",
              },
              429,
              anonymousSetCookie,
            );
      }
      if (reservation.kind === "in_progress") {
        return jsonWithAnonymousCookie(
          { error: "This analysis is still in progress. Please retry shortly." },
          409,
          anonymousSetCookie,
        );
      }
      if (reservation.kind === "replayed") {
        if (!isSuccessfulAnalysisResult(reservation.result)) {
          return jsonWithAnonymousCookie({ error: "Saved analysis result is unavailable." }, 503, anonymousSetCookie);
        }
        return jsonWithAnonymousCookie(reservation.result, 200, anonymousSetCookie);
      }

      quota = { requestId, fingerprint, store };
    }
  }

  const result = await analyzeHandHistory(normalizedHandHistory);

  if (!result.ok) {
    if (quota) await safelyReleaseQuota(quota, userId);
    return jsonWithAnonymousCookie({ error: result.error }, 422, anonymousSetCookie);
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
        return jsonWithAnonymousCookie({ error: "Analysis could not be confirmed. Please retry." }, 409, anonymousSetCookie);
      }
    } catch (error) {
      console.error("[Kevixo analysis quota confirmation failed]", {
        userId,
        requestId: quota.requestId,
        error: getErrorDetails(error),
      });
      return jsonWithAnonymousCookie({ error: "Analysis is temporarily unavailable." }, 503, anonymousSetCookie);
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

  return jsonWithAnonymousCookie(result, 200, anonymousSetCookie);
}

function jsonWithAnonymousCookie(body: unknown, status: number, setCookie: string | undefined) {
  const response = NextResponse.json(body, { status });
  if (setCookie) response.headers.set("Set-Cookie", setCookie);
  return response;
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
