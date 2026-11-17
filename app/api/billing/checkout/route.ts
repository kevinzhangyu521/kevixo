import { NextResponse } from "next/server";
import { getPaddleCheckoutConfiguration } from "@/lib/paddle-admin";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { isCoachUser } from "@/lib/subscription";
import { isCoachCheckoutEnabled } from "@/lib/coach-checkout";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in before upgrading." }, { status: 401 });
  }

  try {
    if (await isCoachUser(user.id)) {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    if (!isCoachCheckoutEnabled(process.env.COACH_CHECKOUT_ENABLED)) {
      return NextResponse.json(
        { ok: false, error: "New Coach subscriptions are not available yet." },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, checkout: getPaddleCheckoutConfiguration(user) });
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
