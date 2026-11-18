"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders, getCurrentAccessToken } from "@/lib/auth-client";
import {
  getCoachCheckoutSubscriptionUi,
  getCoachCheckoutFailureState,
  isCoachCheckoutEnabled,
  openCoachPaddleCheckout,
  type CoachCheckoutAccess,
  type CoachCheckoutSubscriptionUi,
} from "@/lib/coach-checkout";
import { saveGrowthEvent } from "@/lib/growth-client";

type PaddleCheckoutConfiguration = {
  clientToken: string;
  environment: "production";
  priceId: string;
  customerEmail: string;
  customData: Record<string, string>;
};

declare global {
  interface Window {
    Paddle?: {
      Initialized?: boolean;
      Initialize: (options: {
        token: string;
        eventCallback: (event: { name?: string; type?: string; data?: unknown }) => void;
      }) => void;
      Update: (options: {
        eventCallback: (event: { name?: string; type?: string; data?: unknown }) => void;
      }) => void;
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customer: { email: string };
          customData: Record<string, string>;
        }) => void;
      };
    };
  }
}

const freeFeatures = [
  "Full AI hand analysis with complete results",
  "Cloud-saved hand review history when you sign in",
  "Leak Tracker, Progress, Daily, and Training",
  "10 successful hand analyses per UTC month",
  "Demo hands and follow-up questions do not use analysis credits",
];

const coachFeatures = [
  "No monthly product analysis quota",
  "The same analysis and study tools included in Free",
  "Active Coach membership shown across Kevixo",
  "Paddle Customer Portal for payment and subscription management",
  "Billed $9.99 monthly; cancel anytime through the Paddle Customer Portal",
  "Normal technical, service, and reasonable-use safeguards apply",
];

const globalCheckoutEnabled = isCoachCheckoutEnabled(process.env.NEXT_PUBLIC_COACH_CHECKOUT_ENABLED);

export default function PricingPage() {
  const [checkoutEnabled, setCheckoutEnabled] = useState(globalCheckoutEnabled);
  const [status, setStatus] = useState(
    globalCheckoutEnabled
      ? "Choose Coach when you need no monthly product analysis quota."
      : "Coach checkout is temporarily unavailable.",
  );
  const [checkoutPhase, setCheckoutPhase] = useState<"idle" | "opening" | "open" | "completed" | "failed">("idle");
  const [subscriptionUi, setSubscriptionUi] = useState<CoachCheckoutSubscriptionUi | null>(null);
  const isLoading = checkoutPhase === "opening";
  const checkoutBusy = isLoading || checkoutPhase === "open";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getCurrentAccessToken();
      if (!token || cancelled) return;

      const response = await fetch("/api/billing/checkout", {
        headers: await getAuthHeaders(),
      });
      const payload = (await response.json()) as { eligible?: boolean; checkoutAccess?: CoachCheckoutAccess };
      const existingSubscriptionUi = payload.checkoutAccess
        ? getCoachCheckoutSubscriptionUi(payload.checkoutAccess)
        : null;
      if (!cancelled && response.ok && existingSubscriptionUi) {
        setSubscriptionUi(existingSubscriptionUi);
        setCheckoutEnabled(false);
        setStatus(existingSubscriptionUi.status);
        return;
      }
      if (!cancelled && response.ok && payload.eligible) {
        setCheckoutEnabled(true);
        setStatus(
          globalCheckoutEnabled
            ? "Choose Coach when you need no monthly product analysis quota."
            : "Live Checkout test access is enabled for this account.",
        );
      }
    })().catch(() => {
      // Keep Checkout closed when eligibility cannot be verified.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout() {
    if (!checkoutEnabled) return;
    setCheckoutPhase("opening");
    setStatus("Preparing checkout...");

    try {
      const token = await getCurrentAccessToken();
      if (!token) {
        window.location.href = "/login?redirect=/pricing";
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      });
      const payload = (await response.json()) as {
        ok: boolean;
        alreadySubscribed?: boolean;
        existingSubscription?: boolean;
        checkoutAccess?: CoachCheckoutAccess;
        checkout?: PaddleCheckoutConfiguration;
        error?: string;
      };

      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Checkout could not be started.");
      const existingSubscriptionUi = payload.checkoutAccess
        ? getCoachCheckoutSubscriptionUi(payload.checkoutAccess)
        : null;
      if (payload.alreadySubscribed || payload.existingSubscription || existingSubscriptionUi) {
        if (!existingSubscriptionUi) throw new Error("Existing subscription could not be managed.");
        setSubscriptionUi(existingSubscriptionUi);
        setStatus(existingSubscriptionUi.status);
        setCheckoutPhase("idle");
        return;
      }
      if (!payload.checkout) throw new Error("Checkout could not be prepared.");

      const paddle = await loadPaddle();
      openCoachPaddleCheckout(
        paddle,
        payload.checkout.clientToken,
        {
          items: [{ priceId: payload.checkout.priceId, quantity: 1 }],
          customer: { email: payload.checkout.customerEmail },
          customData: payload.checkout.customData,
        },
        (nextState) => {
          setCheckoutPhase(nextState.phase);
          setStatus(nextState.status);
        },
        () => {
          void saveGrowthEvent("checkout_completed");
        },
      );
      void saveGrowthEvent("checkout_started");
    } catch (error) {
      const failureState = getCoachCheckoutFailureState(error);
      setStatus(failureState.status);
      setCheckoutPhase(failureState.phase);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze Free" ctaHref="/review" />
      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Kevixo plans</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">AI poker coaching plans</h1>
          <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">Guest: One free real hand analysis. No signup required. Free includes 10 successful hand analyses per UTC month. Coach: $9.99/month. No monthly product analysis quota.</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">Demo hands and follow-up questions do not use analysis credits.</p>
        </div>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto_1fr_auto]">
          <PricingCard
            title="Free"
            price="$0"
            description="Use every currently available analysis and study tool at no cost."
            features={freeFeatures}
            action={<Button asChild variant="secondary"><Link href="/review">Use Kevixo Free</Link></Button>}
          />
          <PricingCard
            highlighted
            title="Coach"
            price="$9.99/month"
            description="Coach removes the monthly product analysis quota. Free and Coach use the same analysis and study tools today; no separate premium AI model or other exclusive feature is promised."
            features={coachFeatures}
            action={
              subscriptionUi ? (
                <Button asChild>
                  <Link href={subscriptionUi.actionHref}>{subscriptionUi.actionLabel}</Link>
                </Button>
              ) : (
                <Button onClick={startCheckout} disabled={!checkoutEnabled || checkoutBusy || checkoutPhase === "completed"}>
                  {!checkoutEnabled ? "Checkout Temporarily Unavailable" : isLoading ? "Opening Checkout..." : checkoutPhase === "open" ? "Checkout Open" : checkoutPhase === "completed" ? "Payment Received" : "Upgrade to Kevixo Coach"}
                </Button>
              )
            }
          />
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-slate-400">{status}</p>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-slate-500">Kevixo is an AI coaching assistant, not a poker solver. It provides educational feedback, not guaranteed results.</p>
      </section>
    </main>
  );
}

function loadPaddle() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  return new Promise<NonNullable<Window["Paddle"]>>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => window.Paddle ? resolve(window.Paddle) : reject(new Error("Checkout could not load."));
    script.onerror = () => reject(new Error("Checkout could not load."));
    document.head.appendChild(script);
  });
}

function PricingCard({ action, description, features, highlighted = false, price, title }: {
  action: React.ReactNode;
  description: string;
  features: string[];
  highlighted?: boolean;
  price: string;
  title: string;
}) {
  return (
    <Card className={["flex h-full flex-col p-6 md:p-7 lg:row-span-5 lg:grid lg:grid-rows-subgrid", highlighted ? "border-primary/35 bg-primary/5" : ""].join(" ")}>
      <CardTitle>{title}</CardTitle>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-50">{price}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-6 grid content-start gap-3 lg:mt-6">
        {features.map((feature) => <div key={feature} className="rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-3 text-sm font-medium text-slate-200">{feature}</div>)}
      </div>
      <div className="mt-auto pt-7 lg:mt-0">{action}</div>
    </Card>
  );
}
