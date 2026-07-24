import { NextResponse } from "next/server";
import { findHandReviewForUserByReviewId } from "@/lib/supabase-hand-reviews";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to view this review." },
      { status: 401 },
    );
  }

  const { reviewId } = await params;

  if (!reviewId) {
    return NextResponse.json({ ok: false, error: "Review ID is required." }, { status: 400 });
  }

  try {
    const review = await findHandReviewForUserByReviewId(user.id, reviewId);

    if (!review) {
      return NextResponse.json({ ok: false, error: "Review not available." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, review });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Review could not be loaded.",
      },
      { status: 500 },
    );
  }
}
