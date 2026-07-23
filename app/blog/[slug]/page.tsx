import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { blogArticles, getBlogArticle, getBlogArticleUrl } from "@/lib/blog";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    return {};
  }

  const url = getBlogArticleUrl(article.slug);

  return {
    title: `${article.title} | Kevixo`,
    description: article.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      siteName: "Kevixo",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [
        {
          url: "https://www.kevixo.com/brand/og-image.png",
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["https://www.kevixo.com/brand/og-image.png"],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    notFound();
  }

  const url = getBlogArticleUrl(article.slug);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: "https://www.kevixo.com/brand/og-image.png",
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: "Kevixo",
      url: "https://www.kevixo.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Kevixo",
      logo: {
        "@type": "ImageObject",
        url: "https://www.kevixo.com/brand/kevixo-icon-512.png",
      },
    },
    mainEntityOfPage: url,
  };

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div>
          <Link href="/blog" className="text-sm font-semibold text-primary hover:text-sky-200">
            Blog
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary">
              {article.category}
            </span>
            <span className="text-slate-500">{article.readingTime}</span>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">{article.description}</p>
        </div>

        <div className="mt-9 space-y-6 text-base leading-8 text-slate-300">
          {article.paragraphs.slice(0, 5).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          <ArticleCta />

          {article.paragraphs.slice(5).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {article.slug === "poker-hand-history-guide" ? <HandReviewGuideLink /> : null}
          {article.slug === "ai-poker-coach" ? <AiCoachRelatedGuides /> : null}
          {article.slug === "poker-mistakes-beginners" ? <BeginnerMistakesRelatedGuides /> : null}
          {article.slug === "gto-poker-strategy" ? <GtoRelatedGuides /> : null}
        </div>

        <Card className="mt-10 border-primary/20 bg-slate-950/58 p-5 md:p-6">
          <CardTitle>Try Kevixo AI Hand Review</CardTitle>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Paste a hand or start with a demo and get a practical coaching report in under
            a minute.
          </p>
          <Button asChild className="mt-5">
            <Link href="/review">Try Kevixo AI Hand Review</Link>
          </Button>
        </Card>
      </article>
    </main>
  );
}

function HandReviewGuideLink() {
  return (
    <Card className="border-slate-800 bg-slate-950/58 p-5 md:p-6">
      <CardTitle>Next guide: review the decision</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Once you understand the hand history record, use Kevixo&apos;s hand review
        framework to study the key decision, ranges, sizing, and next-time lesson.
      </p>
      <Link
        href="/blog/how-to-review-poker-hands"
        className="mt-5 inline-flex text-sm font-semibold text-primary hover:text-sky-200"
      >
        Read How to Review Poker Hands
      </Link>
    </Card>
  );
}

function AiCoachRelatedGuides() {
  return (
    <Card className="border-slate-800 bg-slate-950/58 p-5 md:p-6">
      <CardTitle>Related study guides</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        AI coaching works best when you understand the hand record and use a clear
        decision review process.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/blog/poker-hand-history-guide"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          Read the hand history guide
        </Link>
        <Link
          href="/blog/how-to-review-poker-hands"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          Read the hand review guide
        </Link>
      </div>
    </Card>
  );
}

function BeginnerMistakesRelatedGuides() {
  return (
    <Card className="border-slate-800 bg-slate-950/58 p-5 md:p-6">
      <CardTitle>Build the full study loop</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        These guides help you turn beginner mistakes into structured hand review,
        cleaner hand records, and better AI-assisted study sessions.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          href="/blog/how-to-review-poker-hands"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          Hand review guide
        </Link>
        <Link
          href="/blog/poker-hand-history-guide"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          Hand history guide
        </Link>
        <Link
          href="/blog/ai-poker-coach"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          AI coach guide
        </Link>
      </div>
    </Card>
  );
}

function GtoRelatedGuides() {
  return (
    <Card className="border-slate-800 bg-slate-950/58 p-5 md:p-6">
      <CardTitle>Study GTO through real hands</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        GTO concepts become easier to understand when you connect them to clean hand
        records, structured review, and AI-assisted coaching notes.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          href="/blog/how-to-review-poker-hands"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          Hand review guide
        </Link>
        <Link
          href="/blog/poker-hand-history-guide"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          Hand history guide
        </Link>
        <Link
          href="/blog/ai-poker-coach"
          className="text-sm font-semibold text-primary hover:text-sky-200"
        >
          AI coach guide
        </Link>
      </div>
    </Card>
  );
}

function ArticleCta() {
  return (
    <Card className="border-primary/20 bg-slate-950/58 p-5 md:p-6">
      <CardTitle>Review one hand while the lesson is fresh</CardTitle>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Kevixo turns a complete hand history into a coaching report with a key lesson,
        better decision, leak, and five-minute homework.
      </p>
      <Button asChild className="mt-5">
        <Link href="/review">Try Kevixo AI Hand Review</Link>
      </Button>
    </Card>
  );
}
