import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: "https://kevixo.com",
    sitemap: "https://kevixo.com/sitemap.xml",
  };
}
