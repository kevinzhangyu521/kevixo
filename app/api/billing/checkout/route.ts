import { NextResponse } from "next/server";
import { getCoachPriceId, getStripe, getStripeCustomerIdForUser } from "@/lib/stripe-admin";
import { getSiteUrl, getUserFromRequest } from "@/lib/supabase-auth";
import { isCoachUser } from "@/lib/subscription";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in before upgrading." }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    if (await isCoachUser(user.id)) {
      return NextResponse.json({ ok: true, url: `${siteUrl}/profile` });
    }

    const existingCustomerId = await getStripeCustomerIdForUser(user.id);
    const customerId =
      existingCustomerId ??
      (
        await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        })
      ).id;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        {
          price: getCoachPriceId(),
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${siteUrl}/welcome/coach?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
    });

    return NextResponse.json({ ok: true, url: session.url });
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
