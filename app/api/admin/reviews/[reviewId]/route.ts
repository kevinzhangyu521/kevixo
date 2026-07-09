import { NextResponse } from "next/server";
import { findHandReviewByReviewId } from "@/lib/supabase-hand-reviews";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const authError = authorizeAdminRequest(request);

  if (authError) {
    return authError;
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

function authorizeAdminRequest(request: Request) {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_FEEDBACK_KEY;
  const passcode = request.headers.get("x-admin-passcode");

  if (!adminKey || passcode !== adminKey) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }

  return null;
}
