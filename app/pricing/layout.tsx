import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = "https://www.kevixo.com";
const pageUrl = `${siteUrl}/pricing`;

export const metadata: Metadata = {
  title: "Plans | Kevixo",
  description: "Explore Kevixo's currently available free hand review and study tools.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Plans | Kevixo",
    description: "Explore Kevixo's currently available free hand review and study tools.",
    url: pageUrl,
    siteName: "Kevixo",
    images: [{ url: `${siteUrl}/brand/og-image.png`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plans | Kevixo",
    description: "Explore Kevixo's currently available free hand review and study tools.",
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
