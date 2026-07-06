import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: "https://www.kevixo.com",
    sitemap: "https://www.kevixo.com/sitemap.xml",
  };
}
