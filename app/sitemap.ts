import type { MetadataRoute } from "next";
import { blogArticles, getBlogArticleUrl } from "@/lib/blog";
import { getSeoLandingPageUrl, seoLandingPages } from "@/lib/seo-landing-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: "https://www.kevixo.com/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.kevixo.com/review",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.kevixo.com/import",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.kevixo.com/daily",
      lastModified,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: "https://www.kevixo.com/pricing",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.kevixo.com/privacy",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.kevixo.com/terms",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.kevixo.com/blog",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...seoLandingPages.map((page) => ({
      url: getSeoLandingPageUrl(page.slug),
      lastModified,
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
