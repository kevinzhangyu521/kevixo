import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = "https://www.kevixo.com";
const pageUrl = `${siteUrl}/daily`;

export const metadata: Metadata = {
  title: "Daily Poker Challenge | Kevixo",
  description:
    "Practice one poker decision each day with a short Kevixo coaching explanation.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Daily Poker Challenge | Kevixo",
    description:
      "Practice one poker decision each day with a short Kevixo coaching explanation.",
    url: pageUrl,
    siteName: "Kevixo",
    images: [{ url: `${siteUrl}/brand/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Poker Challenge | Kevixo",
    description:
      "Practice one poker decision each day with a short Kevixo coaching explanation.",
    images: [`${siteUrl}/brand/og-image.png`],
  },
};

export default function DailyLayout({ children }: { children: ReactNode }) {
  return children;
}
