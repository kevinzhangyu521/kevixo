import { NextResponse } from "next/server";
import { insertReviewFeedback } from "@/lib/supabase-feedback";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const feedback = await insertReviewFeedback(payload);

    return NextResponse.json({ ok: true, feedback });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Kevixo could not save this feedback right now.",
      },
      { status: 500 },
    );
  }
}
