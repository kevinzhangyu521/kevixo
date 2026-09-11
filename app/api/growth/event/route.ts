import { NextResponse } from "next/server";
import { insertGrowthEvent, type GrowthEventType } from "@/lib/growth-events";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { isGrowthEventType } from "@/lib/funnel-events";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    eventType?: GrowthEventType;
    reviewId?: string;
    visitorId?: string;
    sourcePage?: string;
  };

  if (!body.eventType || !isGrowthEventType(body.eventType)) {
    return NextResponse.json({ ok: false, error: "Event is not supported." }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);

    await insertGrowthEvent({
      eventType: body.eventType,
      reviewId: body.reviewId,
      visitorId: body.visitorId,
      userId: user?.id,
      sourcePage: body.sourcePage,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Kevixo growth event failed]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Event could not be saved." }, { status: 200 });
  }
}
