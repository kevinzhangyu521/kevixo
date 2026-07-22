import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewShareCard } from "@/components/review-share-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { findHandReviewByReviewId } from "@/lib/supabase-hand-reviews";
import { getSharePath, toShareReview } from "@/lib/share-review";

const siteUrl = "https://www.kevixo.com";

type SharePageProps = {
  params: Promise<{ reviewId: string }>;
};

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { reviewId } = await params;
  const review = await findPublicReview(reviewId);

  if (!review) {
    return {
      title: "Review not available | Kevixo",
      robots: { index: false, follow: false },
    };
  }

  const shareReview = toShareReview(review.report);
  const title = `Kevixo AI Review: ${shareReview.grade} | ${shareReview.biggestMistake}`;
  const description = `Kevixo found the better decision: ${shareReview.betterDecision}`;
  const path = getSharePath(reviewId);

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: "Kevixo",
      type: "article",
      images: [
        {
          url: `${siteUrl}${path}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Kevixo AI poker review summary",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}${path}/opengraph-image`],
    },
  };
}

export default async function ShareReviewPage({ params }: SharePageProps) {
  const { reviewId } = await params;
  const review = await findPublicReview(reviewId);

  if (!review) {
    notFound();
  }

  const shareReview = toShareReview(review.report);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Kevixo AI Review: ${shareReview.grade}`,
    description: `Read a Kevixo AI poker coaching summary: ${shareReview.biggestMistake}`,
    url: `${siteUrl}${getSharePath(reviewId)}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Kevixo",
      url: siteUrl,
    },
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader ctaLabel="Analyze My Hand" ctaHref="/review" />

      <section className="mx-auto w-full max-w-[960px] px-5 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Shared AI Review
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            A Kevixo coaching summary
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-400">
            This public page shows only the coaching summary. Private hand text and feedback data
            are not shown.
          </p>
        </div>

        <ReviewShareCard report={shareReview} showActions={false} />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Card>
            <CardTitle>Key Lesson</CardTitle>
            <p className="mt-3 text-lg leading-8 text-slate-200">{shareReview.keyLesson}</p>
          </Card>
          <Card>
            <CardTitle>Homework</CardTitle>
            <p className="mt-3 text-lg leading-8 text-slate-200">{shareReview.homework}</p>
          </Card>
        </div>

        <Card className="mt-6 border-primary/25 bg-primary/5 text-center">
          <CardTitle>Try Kevixo AI Hand Review</CardTitle>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-300">
            Upload or paste one hand and get your own coaching report in under 60 seconds.
          </p>
          <div className="mt-5">
            <Button asChild className="shadow-[0_0_28px_rgba(59,201,255,0.18)]">
              <Link href="/review">Analyze Your Own Hand</Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

async function findPublicReview(reviewId: string) {
  if (!reviewId || reviewId.length > 160) {
    return null;
  }

  try {
    return await findHandReviewByReviewId(reviewId);
  } catch {
    return null;
  }
}
