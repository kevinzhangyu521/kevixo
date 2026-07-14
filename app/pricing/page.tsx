"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getAuthHeaders, getCurrentAccessToken } from "@/lib/auth-client";

const freeFeatures = ["Hand Review", "Daily Challenge", "Weekly Progress", "Review History"];
const coachFeatures = [
  "Monthly Coach Report",
  "Coach Timeline",
  "Full Progress History",
  "Future Coach Features",
];

export default function PricingPage() {
  const [status, setStatus] = useState("Upgrade when you are ready for long-term coaching.");
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setIsLoading(true);
    setStatus("Preparing checkout...");

    try {
      const token = await getCurrentAccessToken();

      if (!token) {
        window.location.href = "/login?redirect=/pricing";
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
      });
      const payload = (await response.json()) as { ok: boolean; url?: string; error?: string };

      if (!response.ok || !payload.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout could not be started.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Checkout could not be started.");
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze Free" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Kevixo Coach
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            Become a Better Poker Player
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">
            Improve consistently with your own AI poker coach.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <PricingCard
            title="Free"
            price="$0"
            description="A genuinely useful way to review hands and build a learning habit."
            features={freeFeatures}
            action={
              <Button asChild variant="secondary">
                <Link href="/review">Use Kevixo Free</Link>
              </Button>
            }
          />
          <PricingCard
            highlighted
            title="Coach"
            price="$9.99/month"
            description="For players who want their improvement to compound over time."
            features={coachFeatures}
            action={
              <Button onClick={startCheckout} disabled={isLoading}>
                {isLoading ? "Opening Checkout..." : "Upgrade to Kevixo Coach"}
              </Button>
            }
          />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-slate-400">{status}</p>
      </section>
    </main>
  );
}

function PricingCard({
  action,
  description,
  features,
  highlighted = false,
  price,
  title,
}: {
  action: React.ReactNode;
  description: string;
  features: string[];
  highlighted?: boolean;
  price: string;
  title: string;
}) {
  return (
    <Card className={["p-6 md:p-7", highlighted ? "border-primary/35 bg-primary/5" : ""].join(" ")}>
      <CardTitle>{title}</CardTitle>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-50">{price}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-6 grid gap-3">
        {features.map((feature) => (
          <div key={feature} className="rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-3 text-sm font-medium text-slate-200">
            {feature}
          </div>
        ))}
      </div>
      <div className="mt-7">{action}</div>
    </Card>
  );
}
