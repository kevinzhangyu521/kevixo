import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  getRelatedArticles,
  getSeoLandingPage,
  getSeoLandingPageUrl,
  seoLandingPages,
} from "@/lib/seo-landing-pages";

const productExplanationCards = [
  {
    title: "Key Lesson",
    description: "Explain the most important decision in your hand.",
  },
  {
    title: "Biggest Mistake",
    description: "Identify the decision that limits your improvement.",
  },
  {
    title: "Better Decision",
    description: "Learn a stronger option with clear reasoning.",
  },
  {
    title: "Leak Detected",
    description: "Discover repeated patterns in your gameplay.",
  },
  {
    title: "Homework",
    description: "Get a practical improvement task after each review.",
  },
];

type SeoLandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return seoLandingPages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: SeoLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);

  if (!page) {
    return {};
  }

  const url = getSeoLandingPageUrl(page.slug);

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url,
      siteName: "Kevixo",
      type: "website",
      images: [
        {
          url: "/brand/og-image.png",
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: ["/brand/og-image.png"],
    },
  };
}

export default async function SeoLandingPage({ params }: SeoLandingPageProps) {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);

  if (!page) {
    notFound();
  }

  const pageUrl = getSeoLandingPageUrl(page.slug);
  const relatedArticles = getRelatedArticles();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.metaTitle,
        description: page.metaDescription,
        isPartOf: {
          "@id": "https://www.kevixo.com/#website",
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
        mainEntity: page.faqs.map((faq) => ({
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
      <SiteHeader ctaLabel="Analyze My Hand" ctaHref="/import" />

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-24 md:pt-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {page.category}
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-tight text-slate-50 md:text-6xl">
            {page.heroTitle}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">{page.heroDescription}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild className="min-h-13 min-w-52 shadow-[0_0_36px_rgba(59,201,255,0.2)]">
              <Link href="/import">Analyze My Hand</Link>
            </Button>
            <Link href="/review" className="text-sm font-semibold text-primary hover:text-sky-200">
              Open the review page
            </Link>
          </div>
        </div>

        <Card className="border-slate-700/70 bg-surface/86 p-5 shadow-[0_0_0_1px_rgba(59,201,255,0.12),0_34px_110px_rgba(0,0,0,0.45)] md:p-6">
          <CardTitle>What Kevixo gives you</CardTitle>
          <div className="mt-5 grid gap-3">
            {productExplanationCards.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-800 bg-slate-950/62 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-50">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Why Kevixo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
              {page.whyTitle}
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-300">
            {page.whyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            From one hand to one better decision.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {page.howItWorks.map((step, index) => (
            <Card key={step.title} className="p-5 md:p-6">
              <span className="text-sm font-semibold text-primary">Step {index + 1}</span>
              <CardTitle className="mt-3">{step.title}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Study Notes
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
              {page.studyNotes.title}
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-300">
            {page.studyNotes.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Key Benefits
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Practical coaching for repeatable improvement.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {page.benefits.map((benefit) => (
            <Card key={benefit.title} className="p-5 md:p-6">
              <CardTitle>{benefit.title}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Questions players ask before reviewing a hand.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {page.faqs.map((faq) => (
            <Card key={faq.question} className="p-5 md:p-6">
              <CardTitle>{faq.question}</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-400">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <Card className="border-primary/20 bg-slate-950/58 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Try Kevixo AI Hand Review</CardTitle>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Start with a demo hand or import your own hand history. Get a coaching
                report that explains the decision and gives you a focused next step.
              </p>
            </div>
            <Button asChild className="min-w-44">
              <Link href="/import">Analyze My Hand</Link>
            </Button>
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Related Articles
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">
              Keep building your review process.
            </h2>
          </div>
          <Link href="/blog" className="text-sm font-semibold text-primary hover:text-sky-200">
            View all articles
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {relatedArticles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group">
              <Card className="h-full p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-[0_0_34px_rgba(59,201,255,0.1)] md:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {article.category}
                </p>
                <CardTitle className="mt-4 leading-7">{article.title}</CardTitle>
                <p className="mt-3 text-sm leading-6 text-slate-400">{article.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
