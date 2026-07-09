import Link from "next/link";
import { AnalyticsLink } from "@/components/analytics-link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { blogArticles } from "@/lib/blog";

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

const features = [
  {
    title: "AI Hand Review",
    description:
      "Paste a complete hand history and get a structured review that explains the key decision, better line, and why the spot matters.",
  },
  {
    title: "Leak Detection",
    description:
      "Surface repeatable mistakes like river overcalling, missed continuation bets, thin value hesitation, or weak turn planning.",
  },
  {
    title: "Personalized Homework",
    description:
      "Every report ends with a short practice task designed to take less than five minutes and reinforce one decision pattern.",
  },
  {
    title: "GTO-inspired Coaching",
    description:
      "Kevixo uses range thinking, blockers, bet sizing, board texture, and EV logic to make advanced concepts easier to apply.",
  },
  {
    title: "Session Improvement",
    description:
      "Review one meaningful hand after a session, save the lesson, and build a clearer map of what to improve next.",
  },
];

const faqs = [
  {
    question: "Which poker sites does Kevixo support?",
    answer:
      "Kevixo is designed to be platform-agnostic. It works best when you provide a complete Texas Hold'em hand history with seats, stacks, blinds, board cards, and all betting actions. Built-in demo hands are available if you do not have a hand history ready.",
  },
  {
    question: "What hand history formats are supported?",
    answer:
      "Kevixo currently focuses on text-based No Limit Texas Hold'em hand histories. The most important requirement is completeness: positions, hole cards, stack sizes, streets, bet sizes, and final action must be included for a useful review.",
  },
  {
    question: "How accurate is the AI poker coaching?",
    answer:
      "Kevixo is a coaching assistant, not a guaranteed solver output. It is strongest at explaining decisions, identifying likely leaks, and giving practical study direction. Complete hand details improve the quality of the review.",
  },
  {
    question: "Is Kevixo free or paid?",
    answer:
      "Kevixo currently lets players try the AI hand review experience without signup. Pricing may be introduced later as the product grows, but the current goal is to make one-hand review fast and easy to test.",
  },
  {
    question: "Is my poker hand history private?",
    answer:
      "Kevixo does not require an account for the current review flow. Feedback and completed reviews may be saved to improve product quality and allow admin review lookup, but the product is intentionally lightweight and does not include public profiles or community sharing.",
  },
  {
    question: "Do I need a solver to use Kevixo?",
    answer:
      "No. Kevixo is built for players who want clearer decisions without opening a solver. The coaching is GTO-inspired, but the output is written in practical language with a key lesson, better decision, checklist, and homework.",
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

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader ctaLabel="Try Free ->" larger />

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
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="min-h-14 min-w-56 px-7 text-base shadow-[0_0_36px_rgba(59,201,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_52px_rgba(59,201,255,0.32)]"
              aria-label="Analyze my hand"
            >
              <AnalyticsLink href="/import" event="analyze_button_clicked">
                Analyze My Hand {"->"}
              </AnalyticsLink>
            </Button>
            <Link
              href="/review"
              className="text-sm font-semibold text-slate-400 transition hover:text-slate-100"
            >
              Open review page
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-slate-800 bg-slate-950/45 px-3 py-1 text-xs leading-5 text-slate-300 md:text-[13px]"
              >
                <span className="mr-2 text-primary">Included</span>
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

      <WhatIsKevixoSection />
      <WhyKevixoSection />
      <FaqSection />
      <BlogPreviewSection />
      <Footer />
    </main>
  );
}

function WhatIsKevixoSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            What is Kevixo?
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            An AI poker hand review platform for decision improvement.
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-slate-300">
          <p>
            Kevixo helps poker players review individual hands with practical AI
            coaching. Paste a complete hand history or start from a demo hand, and
            Kevixo turns the spot into a clear poker hand analysis with a key lesson,
            biggest mistake, better decision, reasoning, and homework.
          </p>
          <p>
            The product is built around how players actually improve: one decision at
            a time. Kevixo uses range thinking, bet sizing, board texture, blockers,
            leak detection, and GTO-inspired coaching concepts to make complex poker
            study easier to understand and act on.
          </p>
          <p>
            Instead of replacing your judgment, Kevixo gives you a structured review
            loop: analyze the hand, understand the leak, save the lesson, and apply a
            personalized improvement task in the next session.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href="/import">Import a Hand</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/blog/how-to-review-poker-hands">Read the hand review guide</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyKevixoSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Why Kevixo?
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          A focused review system for poker players who want better decisions.
        </h2>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="p-5 md:p-6">
            <CardTitle>{feature.title}</CardTitle>
            <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          Common questions about AI poker hand review.
        </h2>
      </div>
      <div className="mt-9 grid gap-4 md:grid-cols-2">
        {faqs.map((faq) => (
          <Card key={faq.question} className="p-5 md:p-6">
            <CardTitle>{faq.question}</CardTitle>
            <p className="mt-3 text-sm leading-6 text-slate-400">{faq.answer}</p>
          </Card>
        ))}
      </div>
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
    { label: "Poker Hand Analyzer", href: "/poker-hand-analyzer" },
    { label: "Hand History Review", href: "/hand-history-review" },
    { label: "Poker Review Tool", href: "/poker-review-tool" },
    { label: "GTO Poker Coach", href: "/gto-poker-coach" },
    { label: "Poker Leak Finder", href: "/poker-leak-finder" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "mailto:hello@kevixo.com" },
    { label: "Feedback", href: "/review" },
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
