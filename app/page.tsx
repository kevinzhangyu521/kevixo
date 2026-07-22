import Link from "next/link";
import { AnalyticsLink } from "@/components/analytics-link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { blogArticles } from "@/lib/blog";
import { getHomepageStats, supportedPokerSites, type HomepageStats } from "@/lib/homepage-stats";

export const dynamic = "force-dynamic";

const valueProps = [
  "No signup required",
  "Review one hand in under 60 seconds",
  "Built for Texas Hold'em decisions",
];

const exampleReview = {
  grade: "B-",
  biggestMistake:
    "Calling a large river bet before naming enough natural bluffs in villain's range.",
  betterDecision:
    "Fold the river unless villain has shown a clear pattern of over-bluffing this line.",
  coachRecommendation:
    "Before calling river, write down value hands, then list at least three believable bluffs. If the bluff list is short, fold with confidence.",
};

const benefits = [
  {
    title: "Make clearer close decisions",
    description:
      "Turn confusing river, turn, and 3-bet spots into a clear decision you can repeat next session.",
  },
  {
    title: "Find the leak behind the hand",
    description:
      "Kevixo points to the pattern, not just the result, so one review becomes useful beyond one pot.",
  },
  {
    title: "Study without solver friction",
    description:
      "Get practical range thinking, bet-size context, and next-step homework in plain language.",
  },
  {
    title: "Build a review habit",
    description:
      "Saved reviews, profile trends, and weekly progress help your study compound over time.",
  },
];

const proBenefits = [
  "Cloud review history across devices",
  "Deeper leak tracking by position and street",
  "Weekly coaching reports sent by email",
  "Priority support for more hand history formats",
];

const faqs = [
  {
    question: "What poker sites does Kevixo support?",
    answer:
      "Kevixo is built to recognize common hand history markers from PokerStars, GGPoker, WPT Global, ACR Poker, 888Poker, Winamax, CoinPoker, and unknown generic formats. Complete hand details still produce the best review.",
  },
  {
    question: "Do I need to format my hand history first?",
    answer:
      "No. Paste the raw hand history. Kevixo cleans common line breaks, spacing, card symbols, currency symbols, and stack formatting before review.",
  },
  {
    question: "Is Kevixo a solver?",
    answer:
      "Kevixo is a coaching assistant. It explains the decision, the likely leak, and the better line in practical language. It is GTO-inspired, but it is designed for fast study rather than solver browsing.",
  },
  {
    question: "Can beginners use Kevixo?",
    answer:
      "Yes. Kevixo is written for beginner and intermediate players who want clear feedback on one hand at a time without learning solver workflows first.",
  },
  {
    question: "Is my review public?",
    answer:
      "Reviews are private by default in your browser. If you choose to share a review, Kevixo creates a public summary page that does not show personal feedback data.",
  },
  {
    question: "What is Kevixo Pro?",
    answer:
      "Kevixo Pro is planned as a paid version for players who want cloud history, deeper trends, and more advanced coaching reports. Payments are not open yet.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const latestArticles = blogArticles.slice(0, 3);

export default async function LandingPage() {
  const stats = await getHomepageStats();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader ctaLabel="Analyze Free" ctaHref="/review" larger />

      <HeroSection />
      <StatsSection stats={stats} />
      <SupportedSitesSection />
      <ExampleReviewSection />
      <WhyPlayersChooseSection />
      <FaqSection />
      <KevixoProSection />
      <BlogPreviewSection />
      <Footer />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-104px)] w-full max-w-6xl gap-10 px-5 pb-12 pt-8 md:grid-cols-[1.04fr_0.96fr] md:items-center md:gap-16 md:pt-0">
      <div className="fade-in">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          AI Poker Coaching
        </p>
        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.96] text-slate-50 md:text-7xl">
          AI Poker Hand Review
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Paste one hand history and get a clear coaching report that explains the mistake,
          the better decision, and what to practice next.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            className="min-h-14 min-w-48 px-7 text-base shadow-[0_0_36px_rgba(59,201,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_52px_rgba(59,201,255,0.32)]"
          >
            <AnalyticsLink href="/review" event="analyze_button_clicked">
              Analyze Free
            </AnalyticsLink>
          </Button>
          <Button asChild variant="secondary" className="min-h-14 px-7 text-base">
            <Link href="#example-review">View Example Review</Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {valueProps.map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-800 bg-slate-950/45 px-3 py-1 text-xs leading-5 text-slate-300 md:text-[13px]"
            >
              <span className="mr-2 text-primary">Included</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <Card className="fade-in relative overflow-hidden border-slate-700/70 bg-surface/86 p-0 shadow-[0_0_0_1px_rgba(59,201,255,0.12),0_34px_110px_rgba(0,0,0,0.45)] [animation-delay:120ms]">
        <div className="border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Example Output</CardTitle>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Anonymized
            </span>
          </div>
        </div>
        <div className="grid gap-3 p-5">
          <HeroPreviewMetric label="Grade" value={exampleReview.grade} strong />
          <HeroPreviewMetric label="Biggest Mistake" value="River bluff catching without enough bluffs" />
          <HeroPreviewMetric label="Better Decision" value="Fold the river against this polar size" />
          <HeroPreviewMetric label="Next Practice" value="List value hands before bluff-catchers" />
        </div>
      </Card>
    </section>
  );
}

function StatsSection({ stats }: { stats: HomepageStats }) {
  const items = [
    { label: "Reviews completed", value: formatStat(stats.reviewsCompleted) },
    { label: "Reviews today", value: formatStat(stats.reviewsToday) },
    {
      label: "Average confidence",
      value: stats.averageConfidence === null ? "Live soon" : `${stats.averageConfidence}%`,
    },
    { label: "Supported platforms", value: stats.supportedPlatforms.toString() },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 md:py-14">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">{item.value}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SupportedSitesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Supported Poker Sites
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Paste raw hand histories from common poker rooms.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-400">
          Kevixo recognizes the source automatically and cleans common formatting issues before
          review.
        </p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {supportedPokerSites.map((site) => (
          <div
            key={site}
            className="rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-primary/30"
          >
            {site}
          </div>
        ))}
      </div>
    </section>
  );
}

function ExampleReviewSection() {
  return (
    <section id="example-review" className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Example AI Review
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            The output sells the habit.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400">
            A Kevixo review is designed to make one decision clearer, not bury you in solver
            language.
          </p>
        </div>
        <Card className="border-primary/25 bg-slate-950/62 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <ExampleMetric label="Grade" value={exampleReview.grade} />
            <ExampleMetric label="Focus" value="River decision" />
          </div>
          <div className="mt-5 grid gap-4">
            <ExampleBlock label="Biggest Mistake" value={exampleReview.biggestMistake} />
            <ExampleBlock label="Better Decision" value={exampleReview.betterDecision} />
            <ExampleBlock label="Coach Recommendation" value={exampleReview.coachRecommendation} />
          </div>
          <div className="mt-6">
            <Button asChild>
              <Link href="/review">Analyze Your Own Hand</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function WhyPlayersChooseSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Why Players Choose Kevixo
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          Built around outcomes players can feel at the table.
        </h2>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className="p-5 md:p-6">
            <CardTitle>{benefit.title}</CardTitle>
            <p className="mt-3 text-sm leading-6 text-slate-400">{benefit.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          Clear answers before you paste a hand.
        </h2>
      </div>
      <div className="mt-9 grid gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-xl border border-slate-800 bg-panel/74 p-5 shadow-glow"
          >
            <summary className="cursor-pointer list-none text-base font-semibold text-slate-50">
              <span className="flex items-center justify-between gap-4">
                {faq.question}
                <span className="text-primary transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-400">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function KevixoProSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <Card className="border-primary/25 bg-primary/5 p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <CardTitle>Coming Soon: Kevixo Pro</CardTitle>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
              For players who want their study to compound.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Pro is planned for players who want deeper history, sharper trends, and more
              personal coaching over time. Payments are not open yet.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="mailto:support@kevixo.com?subject=Kevixo%20Pro%20Waitlist">
                  Join Waitlist
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {proBenefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-xl border border-slate-800 bg-slate-950/48 px-4 py-3 text-sm leading-6 text-slate-200"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

function BlogPreviewSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Latest Articles
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Learn how to review poker hands with more structure.
          </h2>
        </div>
        <Link href="/blog" className="text-sm font-semibold text-primary hover:text-sky-200">
          View all articles
        </Link>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {latestArticles.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`} className="group">
            <Card className="h-full p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-[0_0_34px_rgba(59,201,255,0.1)] md:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary">
                  {article.category}
                </span>
                <span className="text-slate-500">{article.readingTime}</span>
              </div>
              <CardTitle className="mt-5 leading-7">{article.title}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{article.description}</p>
              <p className="mt-6 text-sm font-semibold text-primary">Read article</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const footerLinks = [
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Review", href: "/review" },
    { label: "Profile", href: "/profile" },
    { label: "Progress", href: "/progress" },
    { label: "Poker Hand Analyzer", href: "/poker-hand-analyzer" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "mailto:support@kevixo.com" },
  ];

  return (
    <footer className="border-t border-slate-900 px-5 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">Kevixo. Every Hand Makes You Better.</p>
        <nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-500 transition hover:text-slate-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

function HeroPreviewMetric({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/62 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={["mt-1 font-semibold leading-6 text-slate-50", strong ? "text-4xl text-primary" : "text-base"].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function ExampleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function ExampleBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/48 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function formatStat(value: number | null) {
  return value === null ? "Live soon" : value.toLocaleString();
}
