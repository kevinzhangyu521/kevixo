import { NextResponse } from "next/server";
import {
  getSupabaseFeedbackErrorDetails,
  insertReviewFeedback,
} from "@/lib/supabase-feedback";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const user = await getUserFromRequest(request);
    const feedback = await insertReviewFeedback(payload, user?.id);

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
