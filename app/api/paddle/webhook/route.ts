import { NextResponse } from "next/server";
import { processPaddleWebhook, verifyIncomingPaddleWebhook } from "@/lib/paddle-admin";

export async function POST(request: Request) {
  const body = await request.text();

  try {
    if (!verifyIncomingPaddleWebhook(body, request.headers.get("paddle-signature"))) {
      return NextResponse.json({ ok: false, error: "Webhook could not be verified." }, { status: 400 });
    }

    await processPaddleWebhook(JSON.parse(body));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Kevixo Paddle webhook failed]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Webhook could not be processed." }, { status: 500 });
  }
}
