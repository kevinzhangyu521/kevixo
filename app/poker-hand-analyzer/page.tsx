import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const siteUrl = "https://www.kevixo.com";
const pageUrl = `${siteUrl}/poker-hand-analyzer`;
const title = "Poker Hand Analyzer - AI Poker Hand Analysis Tool | Kevixo";
const description =
  "Analyze poker hands with AI-powered explanations. Review decisions, understand mistakes, and improve your poker study process with Kevixo.";

const howItWorks = [
  {
    title: "Import your poker hand",
    description:
      "Paste a complete hand history or start from a supported import flow. Kevixo uses the hand context to understand positions, stacks, board cards, actions, and bet sizes.",
  },
  {
    title: "AI reviews important decisions",
    description:
      "The review focuses on the street and action that matter most, such as a river call, turn barrel, missed value bet, or unclear preflop choice.",
  },
  {
    title: "Learn from structured explanations",
    description:
      "Each analysis turns the hand into a clear lesson with a better decision, supporting reasoning, and a practical study takeaway.",
  },
];

const analysisAreas = [
  "Key decision points",
  "Bet sizing",
  "Board texture",
  "Hand history context",
  "Decision alternatives",
];

const benefits = [
  {
    title: "Faster review workflow",
    description:
      "Move from raw hand history to a structured coaching report without building a full manual review document from scratch.",
  },
  {
    title: "Clearer explanations",
    description:
      "Understand why one decision is stronger by studying position, sizing, board texture, and likely ranges in plain language.",
  },
  {
    title: "Consistent study process",
    description:
      "Use the same decision-focused format across hands so each review becomes easier to compare and remember.",
  },
  {
    title: "Repeated mistake awareness",
    description:
      "Notice patterns such as missed value, loose river calls, unclear turn plans, or sizing choices that need more attention.",
  },
];

const comparisonRows = [
  {
    manual: "Manual review can take a long time because the player has to organize the hand, choose the key street, and write notes independently.",
    ai: "AI-assisted review gives the hand a structure quickly, helping players focus on the decision instead of the formatting.",
  },
  {
    manual: "Manual review often depends on experience, which can make it difficult for newer players to identify patterns across hands.",
    ai: "AI-assisted review keeps feedback consistent, making repeated decision themes easier to see over time.",
  },
  {
    manual: "Manual notes can become scattered across forums, chat messages, spreadsheets, or memory.",
    ai: "A poker review software workflow keeps the lesson, mistake, better decision, and homework in one readable coaching format.",
  },
];

const faqs = [
  {
    question: "What is a poker hand analyzer?",
    answer:
      "A poker hand analyzer is a study tool that reviews a completed poker hand and explains the decisions inside it. Kevixo focuses on decision analysis, hand history context, mistakes, better actions, and learning notes.",
  },
  {
    question: "How does AI analyze poker hands?",
    answer:
      "AI analyzes poker hands by reading the game situation, positions, stack sizes, board texture, betting actions, bet sizes, possible ranges, and decision quality. The goal is to explain the hand in a way that supports study.",
  },
  {
    question: "Can Kevixo analyze poker hand history?",
    answer:
      "Yes. Kevixo is designed to review complete poker hand histories that include positions, stacks, blinds, hole cards, board cards, betting actions, and bet sizes.",
  },
  {
    question: "Does Kevixo guarantee poker results?",
    answer:
      "No. Kevixo is designed for learning and decision analysis, not guaranteed outcomes.",
  },
];

const internalLinks = [
  {
    href: "/blog/poker-analyzer",
    label: "Poker Analyzer Guide",
    description: "Learn how AI review tools support poker study.",
  },
  {
    href: "/blog/how-to-review-poker-hands",
    label: "How to Review Poker Hands",
    description: "Build a repeatable hand review process.",
  },
  {
    href: "/blog/poker-hand-analysis-framework",
    label: "Poker Hand Analysis Framework",
    description: "Use a step-by-step structure for better decisions.",
  },
  {
    href: "/blog/ai-poker-coach",
    label: "AI Poker Coach",
    description: "Understand how AI coaching supports study habits.",
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    siteName: "Kevixo",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kevixo AI poker hand analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/brand/og-image.png"],
  },
};

export default function PokerHandAnalyzerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        isPartOf: {
          "@id": `${siteUrl}/#website`,
        },
        about: {
          "@type": "SoftwareApplication",
          name: "Kevixo",
          applicationCategory: "Poker training software",
          operatingSystem: "Web",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader ctaLabel="Analyze My Hand" ctaHref="/review" />

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-24 md:pt-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Poker Hand Analyzer
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-tight text-slate-50 md:text-6xl">
            AI Poker Hand Analyzer for Better Decisions
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Kevixo helps players analyze poker hands with structured AI explanations.
            Understand key decisions, review hand history, and build better study habits.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="min-h-13 min-w-52 shadow-[0_0_36px_rgba(59,201,255,0.2)]">
              <Link href="/review">Analyze My Hand</Link>
            </Button>
            <Link href="/blog" className="text-sm font-semibold text-primary hover:text-sky-200">
              Learn Poker Strategy
            </Link>
          </div>
        </div>

        <Card className="border-slate-700/70 bg-surface/86 p-5 shadow-[0_0_0_1px_rgba(59,201,255,0.12),0_34px_110px_rgba(0,0,0,0.45)] md:p-6">
          <CardTitle>What Kevixo analyzes</CardTitle>
          <div className="mt-5 grid gap-3">
            {analysisAreas.map((area) => (
              <div
                key={area}
                className="rounded-xl border border-slate-800 bg-slate-950/62 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-50">{area}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            How AI Poker Hand Analysis Works
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <Card key={step.title} className="p-5 md:p-6">
              <span className="text-sm font-semibold text-primary">Step {index + 1}</span>
              <CardTitle className="mt-3">{step.title}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Why Use AI
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Why Use an AI Poker Hand Analyzer?
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-slate-300">
          <p>
            A poker hand analyzer helps players study hands while the details are still
            clear. Instead of replaying a hand from memory, you can use the hand history
            as the source of truth and focus on the decision that shaped the spot.
          </p>
          <p>
            Kevixo is designed for players who want faster review workflow, clearer
            explanations, a consistent study process, and easier identification of
            repeated mistakes. The product is not about chasing a single result. It is
            about learning why a decision made sense, why another option may be stronger,
            and what to practice next.
          </p>
          <p>
            For a deeper study routine, combine Kevixo with the{" "}
            <Link href="/blog/poker-hand-analysis-framework" className="text-primary hover:text-sky-200">
              poker hand analysis framework
            </Link>{" "}
            and the guide on{" "}
            <Link href="/blog/how-to-review-poker-hands" className="text-primary hover:text-sky-200">
              how to review poker hands
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Analysis Areas
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            What Kevixo Analyzes
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Kevixo studies the hand as a decision record, not just a final pot. The review
            connects hand history context with practical coaching language.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analysisAreas.map((area) => (
            <Card key={area} className="p-5 md:p-6">
              <CardTitle>{area}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Kevixo turns this part of the hand into readable feedback so players can
                understand the decision and build a cleaner study note.
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Review Methods
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            AI Poker Analysis vs Manual Review
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-5 md:p-6">
            <CardTitle>Manual review</CardTitle>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
              {comparisonRows.map((row) => (
                <li key={row.manual}>{row.manual}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 md:p-6">
            <CardTitle>AI-assisted review</CardTitle>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
              {comparisonRows.map((row) => (
                <li key={row.ai}>{row.ai}</li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Benefits
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            A poker hand analysis tool for repeatable study.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="p-5 md:p-6">
              <CardTitle>{benefit.title}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Study Guides
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Continue learning with Kevixo.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {internalLinks.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-[0_0_34px_rgba(59,201,255,0.1)] md:p-6">
                <CardTitle>{item.label}</CardTitle>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Questions about poker hand analyzers.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question} className="p-5 md:p-6">
              <CardTitle>{faq.question}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 md:pb-28">
        <Card className="border-primary/20 bg-slate-950/58 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <CardTitle>Analyze your next hand with Kevixo.</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Paste a hand history and get structured AI coaching focused on the
                decision that matters most.
              </p>
            </div>
            <Button asChild className="min-h-12 whitespace-nowrap">
              <Link href="/review">Analyze My Hand</Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
