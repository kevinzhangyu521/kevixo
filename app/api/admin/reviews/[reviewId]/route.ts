import { NextResponse } from "next/server";
import { findHandReviewByReviewId } from "@/lib/supabase-hand-reviews";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const { reviewId } = await params;

  if (!reviewId) {
    return NextResponse.json({ ok: false, error: "Review ID is required." }, { status: 400 });
  }

  try {
    const review = await findHandReviewByReviewId(reviewId);

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
