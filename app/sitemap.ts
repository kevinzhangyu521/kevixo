import type { MetadataRoute } from "next";
import { blogArticles, getBlogArticleUrl } from "@/lib/blog";
import { getSeoLandingPageUrl, seoLandingPages } from "@/lib/seo-landing-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.kevixo.com/",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.kevixo.com/review",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.kevixo.com/about",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.kevixo.com/import",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.kevixo.com/daily",
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: "https://www.kevixo.com/pricing",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.kevixo.com/privacy",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.kevixo.com/terms",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.kevixo.com/refund-policy",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.kevixo.com/blog",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.kevixo.com/poker-hand-analyzer",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.kevixo.com/ai-poker-coach",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...seoLandingPages.map((page) => ({
      url: getSeoLandingPageUrl(page.slug),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...blogArticles.map((article) => ({
      url: getBlogArticleUrl(article.slug),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
