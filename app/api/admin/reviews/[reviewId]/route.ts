import { NextResponse } from "next/server";
import { authorizeAdminUser } from "@/lib/admin-users";
import { findHandReviewByReviewId } from "@/lib/supabase-hand-reviews";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const authError = await authorizeAdminUser(request);

  if (!authError.ok) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status },
    );
  }

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
