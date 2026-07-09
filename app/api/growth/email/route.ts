import { NextResponse } from "next/server";
import { insertEmailCapture } from "@/lib/growth-events";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    reviewId?: string;
    visitorId?: string;
    sourcePage?: string;
  };
  const email = body.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await insertEmailCapture({
      email,
      reviewId: body.reviewId,
      visitorId: body.visitorId,
      sourcePage: body.sourcePage,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Kevixo email capture failed]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { ok: false, error: "Email could not be saved. Please try again later." },
      { status: 500 },
    );
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
