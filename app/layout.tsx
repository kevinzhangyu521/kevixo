import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kevixo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Kevixo | Master Every Decision",
  description: "AI poker hand analyzer for actionable coaching reports.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Kevixo | Master Every Decision",
    description: "AI poker hand analyzer for actionable coaching reports.",
    siteName: "Kevixo",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kevixo - Master Every Decision",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kevixo | Master Every Decision",
    description: "AI poker hand analyzer for actionable coaching reports.",
    images: ["/brand/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
