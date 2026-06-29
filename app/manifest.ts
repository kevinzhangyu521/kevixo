import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kevixo",
    short_name: "Kevixo",
    description: "AI-powered poker coaching that helps you improve one decision at a time.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/brand/kevixo-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
