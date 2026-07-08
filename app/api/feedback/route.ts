import { NextResponse } from "next/server";
import {
  getSupabaseFeedbackErrorDetails,
  insertReviewFeedback,
} from "@/lib/supabase-feedback";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const feedback = await insertReviewFeedback(payload);

    return NextResponse.json({ ok: true, feedback });
  } catch (error) {
    const supabaseError = getSupabaseFeedbackErrorDetails(error);

    return NextResponse.json(
      {
        ok: false,
        error: `Insert failed: ${supabaseError.message}`,
        supabaseError,
      },
      { status: 500 },
    );
  }
}
