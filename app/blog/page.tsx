import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Card, CardTitle } from "@/components/ui/card";
import { blogArticles } from "@/lib/blog";

const title = "Kevixo Blog - Poker Strategy, Hand Analysis, and AI Coaching Insights";
const description =
  "Learn poker strategy concepts, hand analysis methods, and study techniques with Kevixo AI poker coaching insights.";
const siteUrl = "https://www.kevixo.com";
const pageUrl = `${siteUrl}/blog`;

export const metadata: Metadata = {
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
        url: `${siteUrl}/brand/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Kevixo poker coaching articles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/brand/og-image.png`],
  },
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Kevixo Blog
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            Kevixo Poker Learning Blog
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Learn poker hand analysis, strategy concepts, and study methods with
            AI-powered coaching insights.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {blogArticles.map((article) => (
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
    </main>
  );
}
