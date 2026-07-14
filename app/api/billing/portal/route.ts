import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-admin";
import { getSiteUrl, getUserFromRequest } from "@/lib/supabase-auth";
import { getSubscription } from "@/lib/subscription";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  try {
    const subscription = await getSubscription(user.id);

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: "No billing account found yet." },
        { status: 400 },
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${getSiteUrl()}/profile`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Billing portal could not be opened.",
      },
      { status: 500 },
    );
  }
}
