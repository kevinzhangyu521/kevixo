import { AnalyticsLink } from "@/components/analytics-link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";

const headlineOptions = [
  "Know Why You Win. Know Why You Lose.",
  "Stop Guessing. Start Improving.",
  "Every Hand Makes You Better.",
];

const trustBadges = [
  "No signup required",
  "AI review in under 60 seconds",
  "Built for Texas Hold'em players",
];

const reviewMetrics = [
  { label: "Overall Grade", value: "A-", detail: "Strong value plan" },
  { label: "Biggest Leak", value: "River Bluff Catching", detail: "Over-defending polar bets" },
  { label: "EV Lost", value: "-18 BB", detail: "Avoidable river call" },
  { label: "Recommendation", value: "Fold River", detail: "Range is under-bluffed" },
  { label: "Homework", value: "Review River Frequencies", detail: "Tag 5 similar spots" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <SiteHeader ctaLabel="Try Free →" larger />

      <section className="mx-auto grid min-h-[calc(100vh-104px)] w-full max-w-6xl gap-12 px-5 pb-8 pt-8 md:grid-cols-[1.18fr_0.82fr] md:items-center md:gap-20 md:pb-8 md:pt-0">
        <div className="fade-in">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            AI Poker Hand Analyzer
          </p>
          <h1 className="max-w-4xl text-6xl font-semibold leading-[0.94] text-slate-50 md:text-[72px]">
            {headlineOptions[0]}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Upload your hand history and receive a practical review that explains
            exactly where you gained or lost EV.
          </p>
          <div className="mt-7">
            <Button
              asChild
              className="min-h-14 min-w-56 px-7 text-base shadow-[0_0_36px_rgba(59,201,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_52px_rgba(59,201,255,0.32)]"
              aria-label="Analyze my hand"
            >
              <AnalyticsLink href="/import" event="analyze_button_clicked">
                Analyze My Hand →
              </AnalyticsLink>
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-slate-800 bg-slate-950/45 px-3 py-1 text-xs leading-5 text-slate-300 md:text-[13px]"
              >
                <span className="mr-2 text-primary">✓</span>
                {badge}
              </span>
            ))}
          </div>
        </div>

        <Card className="fade-in hover-lift relative overflow-hidden border-slate-700/70 bg-surface/86 p-0 shadow-[0_0_0_1px_rgba(59,201,255,0.12),0_34px_110px_rgba(0,0,0,0.45)] [animation-delay:120ms]">
          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Kevixo Review</CardTitle>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                42s
              </span>
            </div>
          </div>
          <div className="space-y-2.5 p-5">
            {reviewMetrics.map((metric, index) => (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-800 bg-slate-950/62 px-4 py-3 transition duration-200 hover:border-primary/30 hover:bg-slate-950/82"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-base font-semibold leading-6 text-slate-50">
                      {metric.value}
                    </p>
                    <p className="mt-0.5 text-sm leading-5 text-slate-500">{metric.detail}</p>
                  </div>
                  {index === 0 ? (
                    <span className="text-4xl font-semibold leading-none text-primary">A-</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 px-6 py-4">
            <p className="text-sm leading-6 text-slate-400">
              Turn one hand into a clear decision review, leak diagnosis, and next
              study target.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}
