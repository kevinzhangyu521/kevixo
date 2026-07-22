import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

const siteUrl = "https://www.kevixo.com";
const pageUrl = `${siteUrl}/about`;

export const metadata: Metadata = {
  title: "About Kevixo | AI Poker Hand Review & Coaching",
  description:
    "Kevixo is an AI-powered poker coaching platform for reviewing hands, understanding decisions, and building better study habits.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "About Kevixo | AI Poker Hand Review & Coaching",
    description:
      "Learn how Kevixo helps poker learners review hands, analyze decisions, and build better study habits through software-based coaching.",
    url: pageUrl,
    siteName: "Kevixo",
    images: [{ url: `${siteUrl}/brand/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Kevixo | AI Poker Hand Review & Coaching",
    description:
      "Kevixo is an AI-powered poker coaching platform focused on education, analysis, and better study habits.",
    images: [`${siteUrl}/brand/og-image.png`],
  },
};

const principles = [
  {
    title: "Software product",
    description:
      "Kevixo is built as a modern web application for structured poker hand review and learning workflows.",
  },
  {
    title: "Education first",
    description:
      "The product focuses on explaining decisions, reviewing hand histories, and helping players study with more clarity.",
  },
  {
    title: "Coaching language",
    description:
      "Reports are written to help learners understand ranges, bet sizing, board texture, and repeatable study habits.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze Free" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            About Kevixo
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            AI-powered poker coaching for better study habits.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">
            Kevixo is an AI-powered poker coaching platform that helps players review hands,
            understand decisions, and build better study habits through clear explanations.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {principles.map((principle) => (
            <Card key={principle.title} className="p-5 md:p-6">
              <CardTitle>{principle.title}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{principle.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 md:p-6">
            <CardTitle>What Kevixo Does</CardTitle>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400">
              <p>
                Kevixo helps poker learners turn a hand history into a structured review. The
                product highlights important decisions, explains improvement opportunities, and
                turns each hand into a small study task.
              </p>
              <p>
                The goal is not to promise outcomes. The goal is to support better analysis,
                stronger review habits, and clearer decision-making over time.
              </p>
            </div>
          </Card>

          <Card className="border-primary/25 bg-primary/5 p-5 md:p-6">
            <CardTitle>What Kevixo Does Not Provide</CardTitle>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <p>Kevixo does not provide betting services.</p>
              <p>Kevixo does not provide wagering.</p>
              <p>Kevixo does not provide financial advice.</p>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/review">Analyze a Hand</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="mailto:support@kevixo.com">Contact Kevixo</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
