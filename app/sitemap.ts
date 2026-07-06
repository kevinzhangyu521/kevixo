import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: "https://kevixo.com/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://kevixo.com/review",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
