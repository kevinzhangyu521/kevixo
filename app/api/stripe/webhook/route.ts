import { NextResponse } from "next/server";
import { getStripe, getStripeWebhookSecret, upsertStripeSubscription } from "@/lib/stripe-admin";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid Stripe webhook.",
      },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (typeof session.subscription === "string") {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        await upsertStripeSubscription(subscription);
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await upsertStripeSubscription(event.data.object);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Kevixo Stripe webhook failed]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Webhook could not be processed." }, { status: 500 });
  }
}
