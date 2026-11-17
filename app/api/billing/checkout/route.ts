import { NextResponse } from "next/server";
import { getPaddleCheckoutConfiguration } from "@/lib/paddle-admin";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { isCoachUser } from "@/lib/subscription";
import { getCoachCheckoutAccess } from "@/lib/coach-checkout";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, eligible: false, error: "Please sign in before upgrading." }, { status: 401 });
  }

  try {
    const access = getCoachCheckoutAccess({
      globalEnabled: process.env.COACH_CHECKOUT_ENABLED,
      isCoach: await isCoachUser(user.id),
      testUserIds: process.env.COACH_CHECKOUT_TEST_USER_IDS,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      eligible: access === "allowed",
      alreadySubscribed: access === "already_subscribed",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, eligible: false, error: error instanceof Error ? error.message : "Checkout availability could not be checked." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in before upgrading." }, { status: 401 });
  }

  try {
    const access = getCoachCheckoutAccess({
      globalEnabled: process.env.COACH_CHECKOUT_ENABLED,
      isCoach: await isCoachUser(user.id),
      testUserIds: process.env.COACH_CHECKOUT_TEST_USER_IDS,
      userId: user.id,
    });

    if (access === "already_subscribed") {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    if (access !== "allowed") {
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
