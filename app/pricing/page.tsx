import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const freeFeatures = [
  "Hand reviews with practical AI feedback",
  "Saved review history when you sign in",
  "Daily practice, progress, and personal training tools",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze Free" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Kevixo plans
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            Study poker decisions with Kevixo
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">
            All currently available hand review and study tools are free to use.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <PricingCard
            title="Free"
            price="$0"
            description="Use Kevixo&apos;s available review and study tools at no cost."
            features={freeFeatures}
            action={
              <Button asChild variant="secondary">
                <Link href="/review">Use Kevixo Free</Link>
              </Button>
            }
          />
          <PricingCard
            title="Coach subscriptions"
            price="Temporarily unavailable"
            description="We are not opening new Coach subscriptions until the plan has a distinct, fully delivered set of benefits."
            features={[
              "New subscriptions are not currently available",
              "Existing subscribers can continue to manage their billing from their account",
            ]}
            action={
              <Button asChild variant="secondary">
                <Link href="/review">Continue with Free</Link>
              </Button>
            }
          />
        </div>
      </section>
    </main>
  );
}

function PricingCard({
  action,
  description,
  features,
  price,
  title,
}: {
  action: React.ReactNode;
  description: string;
  features: string[];
  price: string;
  title: string;
}) {
  return (
    <Card className="p-6 md:p-7">
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
