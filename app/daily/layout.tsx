import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Daily Poker Challenge | Kevixo",
  description:
    "Practice one poker decision each day with a short Kevixo coaching explanation.",
  alternates: {
    canonical: "https://www.kevixo.com/daily",
  },
  openGraph: {
    title: "Daily Poker Challenge | Kevixo",
    description:
      "Practice one poker decision each day with a short Kevixo coaching explanation.",
    url: "https://www.kevixo.com/daily",
    siteName: "Kevixo",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Poker Challenge | Kevixo",
    description:
      "Practice one poker decision each day with a short Kevixo coaching explanation.",
    images: ["/brand/og-image.png"],
  },
};

export default function DailyLayout({ children }: { children: ReactNode }) {
  return children;
}
