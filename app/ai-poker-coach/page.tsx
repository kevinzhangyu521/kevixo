import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const siteUrl = "https://www.kevixo.com";
const pageUrl = `${siteUrl}/ai-poker-coach`;
const title = "AI Poker Coach - Improve Your Poker Decisions with Kevixo";
const description =
  "Kevixo is an AI poker coach that helps players review hands, understand decisions, and build better study habits through structured analysis.";

const coachingAreas = [
  {
    title: "Reviews hand decisions",
    description:
      "Kevixo studies the action in a completed hand and focuses on the decision that matters most for learning.",
  },
  {
    title: "Explains key moments",
    description:
      "The coaching report highlights why a street, bet size, board card, or line changed the shape of the hand.",
  },
  {
    title: "Identifies learning opportunities",
    description:
      "Each review turns mistakes and close decisions into practical study points that are easier to remember.",
  },
  {
    title: "Creates structured study notes",
    description:
      "Kevixo organizes feedback into a clear lesson, better decision, reasoning, coach note, and homework.",
  },
];

const howItWorks = [
  {
    title: "Import your hand history",
    description:
      "Start with a complete hand record that includes positions, stacks, board cards, betting actions, and bet sizes.",
  },
  {
    title: "AI analyzes important decisions",
    description:
      "Kevixo reviews the hand context and identifies the spot where the clearest coaching lesson appears.",
  },
  {
    title: "Receive clear coaching feedback",
    description:
      "Get a structured explanation that helps you understand the decision and create a better study habit.",
  },
];

const studyComparison = [
  {
    traditional:
      "Traditional study often depends on manual review, notes, forum posts, or memory after a session.",
    assisted:
      "AI-assisted study gives each hand a repeatable structure so review starts with the same useful questions.",
  },
  {
    traditional:
      "Pattern recognition can be difficult when hands are reviewed in different places or without a consistent format.",
    assisted:
      "Kevixo helps players notice repeated learning themes by keeping the review focused on decisions and habits.",
  },
  {
    traditional:
      "Feedback can be inconsistent when a player relies on scattered advice or only reviews emotionally memorable hands.",
    assisted:
      "A poker study assistant can provide steady coaching language around position, sizing, board texture, and ranges.",
  },
];

const audienceCards = [
  {
    title: "Beginners learning fundamentals",
    description:
      "Use Kevixo to understand why position, stack size, board texture, and betting actions matter in hand review.",
  },
  {
    title: "Players reviewing sessions",
    description:
      "Turn one saved hand into a clear coaching note while the decision is still fresh.",
  },
  {
    title: "Players building study habits",
    description:
      "Create a repeatable review loop that connects hand history, decision analysis, and short homework.",
  },
];

const faqs = [
  {
    question: "What is an AI poker coach?",
    answer:
      "An AI poker coach is a study tool that helps players review hands, understand decisions, and turn completed hands into structured learning notes.",
  },
  {
    question: "How does AI poker coaching work?",
    answer:
      "AI poker coaching reviews the hand history, studies the situation, identifies important decisions, and explains the reasoning behind stronger alternatives.",
  },
  {
    question: "Can AI replace poker coaches?",
    answer:
      "No. AI can support study with structured explanations and consistent review, but players still need practice, judgment, and deeper learning over time.",
  },
  {
    question: "Does Kevixo guarantee poker results?",
    answer:
      "No. Kevixo provides learning support and decision analysis, not guaranteed outcomes.",
  },
];

const internalLinks = [
  {
    href: "/blog/ai-poker-coach",
    title: "AI Poker Coach Guide",
    description: "Learn how AI coaching supports poker study and decision review.",
  },
  {
    href: "/blog/poker-analyzer",
    title: "Poker Analyzer Guide",
    description: "Understand how AI review tools analyze completed hands.",
  },
  {
    href: "/blog/poker-hand-analysis-framework",
    title: "Poker Hand Analysis Framework",
    description: "Use a step-by-step process for reviewing decisions.",
  },
  {
    href: "/poker-hand-analyzer",
    title: "Poker Hand Analyzer",
    description: "Explore Kevixo's AI hand analysis landing page.",
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
        alt: "Kevixo AI poker coach",
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

export default function AiPokerCoachPage() {
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
            AI Poker Coach
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-tight text-slate-50 md:text-6xl">
            AI Poker Coach for Smarter Hand Review
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Kevixo helps poker players study their hands with AI-powered explanations.
            Review decisions, understand mistakes, and create a better learning process.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="min-h-13 min-w-52 shadow-[0_0_36px_rgba(59,201,255,0.2)]">
              <Link href="/review">Analyze My Hand</Link>
            </Button>
            <Link href="/blog" className="text-sm font-semibold text-primary hover:text-sky-200">
              Explore Poker Guides
            </Link>
          </div>
        </div>

        <Card className="border-slate-700/70 bg-surface/86 p-5 shadow-[0_0_0_1px_rgba(59,201,255,0.12),0_34px_110px_rgba(0,0,0,0.45)] md:p-6">
          <CardTitle>What an AI poker coach does</CardTitle>
          <div className="mt-5 grid gap-3">
            {coachingAreas.map((area) => (
              <div
                key={area.title}
                className="rounded-xl border border-slate-800 bg-slate-950/62 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-50">{area.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{area.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Coaching Flow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            How Kevixo Coaching Works
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
            Study Process
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            AI Poker Coach vs Traditional Study
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-slate-300">
          <p>
            Traditional poker study is valuable, but it can become scattered. A player may
            review one hand manually, save another in a notes app, ask about a third hand
            in a chat, and forget the pattern connecting all three. That makes it harder to
            turn review into a consistent learning process.
          </p>
          <p>
            Kevixo works as a poker study assistant by giving each hand the same coaching
            structure. The review focuses on the decision, explains the key moment, and
            creates a practical note. This makes AI poker training easier to repeat after
            each session.
          </p>
          <p>
            To understand how this fits into broader hand analysis, read the{" "}
            <Link href="/blog/poker-hand-analysis-framework" className="text-primary hover:text-sky-200">
              poker hand analysis framework
            </Link>{" "}
            and the{" "}
            <Link href="/blog/poker-analyzer" className="text-primary hover:text-sky-200">
              poker analyzer guide
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 md:p-6">
            <CardTitle>Traditional study</CardTitle>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
              {studyComparison.map((item) => (
                <li key={item.traditional}>{item.traditional}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 md:p-6">
            <CardTitle>AI-assisted study</CardTitle>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
              {studyComparison.map((item) => (
                <li key={item.assisted}>{item.assisted}</li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Players
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Who Is Kevixo For?
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {audienceCards.map((audience) => (
            <Card key={audience.title} className="p-5 md:p-6">
              <CardTitle>{audience.title}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{audience.description}</p>
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
                <CardTitle>{item.title}</CardTitle>
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
            Questions about AI poker coaching.
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
              <CardTitle>Review one hand with Kevixo.</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Paste a hand history and get AI coaching focused on the decision that
                matters most.
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
