import { NextResponse } from "next/server";
import { getPaddleCheckoutConfiguration } from "@/lib/paddle-admin";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { getBlockingPaddleSubscriptionStatus } from "@/lib/subscription";
import { getCoachCheckoutAccess } from "@/lib/coach-checkout";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, eligible: false, error: "Please sign in before upgrading." }, { status: 401 });
  }

  try {
    const access = getCoachCheckoutAccess({
      globalEnabled: process.env.COACH_CHECKOUT_ENABLED,
      subscriptionStatus: await getBlockingPaddleSubscriptionStatus(user.id),
      testUserIds: process.env.COACH_CHECKOUT_TEST_USER_IDS,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      eligible: access === "allowed",
      alreadySubscribed: access === "already_subscribed",
      checkoutAccess: access,
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
      subscriptionStatus: await getBlockingPaddleSubscriptionStatus(user.id),
      testUserIds: process.env.COACH_CHECKOUT_TEST_USER_IDS,
      userId: user.id,
    });

    if (access === "already_subscribed") {
      return NextResponse.json({ ok: true, alreadySubscribed: true, checkoutAccess: access });
    }

    if (access === "payment_update_required" || access === "subscription_paused") {
      return NextResponse.json({ ok: true, existingSubscription: true, checkoutAccess: access });
    }

    if (access !== "allowed") {
      return NextResponse.json(
        { ok: false, error: "Coach checkout is temporarily unavailable." },
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
