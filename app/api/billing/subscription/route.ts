import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { getSubscription, isCoachUser } from "@/lib/subscription";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  try {
    const subscription = await getSubscription(user.id);
    const coach = await isCoachUser(user.id);

    return NextResponse.json({
      ok: true,
      subscription,
      isCoach: coach,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Subscription could not be loaded.",
      },
      { status: 500 },
    );
  }
}
