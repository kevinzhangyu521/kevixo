import type { MetadataRoute } from "next";

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
  ];
}
