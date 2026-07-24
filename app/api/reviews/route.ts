import { NextResponse } from "next/server";
import { listHandReviewsForUser } from "@/lib/supabase-hand-reviews";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to view your reviews." },
      { status: 401 },
    );
  }

  try {
    const reviews = await listHandReviewsForUser(user.id);

    return NextResponse.json({
      ok: true,
      reviews,
      total: reviews.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Reviews could not be loaded.",
      },
      { status: 500 },
    );
  }
}
