import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = "https://www.kevixo.com";
const pageUrl = `${siteUrl}/pricing`;
const title = "AI Poker Coaching Plans | Kevixo";
const description =
  "Compare Guest, Free, and Coach: one free real hand analysis for Guest, 10 successful hand analyses per UTC month for Free, and Coach at $9.99/month. No monthly product analysis quota applies to Coach.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    siteName: "Kevixo",
    images: [{ url: `${siteUrl}/brand/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/brand/og-image.png`],
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
