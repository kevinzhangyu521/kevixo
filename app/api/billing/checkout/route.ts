import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { isCoachUser } from "@/lib/subscription";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in before upgrading." }, { status: 401 });
  }

  try {
    if (await isCoachUser(user.id)) {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    return NextResponse.json(
      { ok: false, error: "New Coach subscriptions are not available yet." },
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Checkout could not be started.",
      },
      { status: 500 },
    );
  }
}
