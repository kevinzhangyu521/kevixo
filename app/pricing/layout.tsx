import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing | Kevixo Coach",
  description:
    "Kevixo pricing for AI-powered poker hand review and coaching tools for serious poker learners.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | Kevixo Coach",
    description:
      "Review Kevixo Coach pricing for AI-powered poker hand review and coaching tools.",
    url: "/pricing",
    siteName: "Kevixo",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Kevixo Coach",
    description:
      "AI-powered hand review and coaching tools for serious poker learners.",
    images: ["/brand/og-image.png"],
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
