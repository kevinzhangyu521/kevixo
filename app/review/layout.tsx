import type { Metadata } from "next";

const siteUrl = "https://www.kevixo.com";
const title = "Kevixo Hand Review | AI Poker Coaching";
const description =
  "Try a demo poker hand or paste your own hand history to get a practical Kevixo coaching review.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${siteUrl}/review`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/review`,
    siteName: "Kevixo",
    type: "website",
    images: [
      {
        url: `${siteUrl}/brand/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Kevixo - Every Hand Makes You Better.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/brand/og-image.png`],
  },
};

const reviewPageStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${siteUrl}/review#webpage`,
  name: title,
  url: `${siteUrl}/review`,
  description,
  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },
};

export default function ReviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewPageStructuredData) }}
      />
      {children}
    </>
  );
}
