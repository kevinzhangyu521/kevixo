import type { Metadata } from "next";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kevixo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Kevixo | Every Hand Makes You Better.",
  description: "AI-powered poker coaching that helps you improve one decision at a time.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Kevixo | Every Hand Makes You Better.",
    description: "AI-powered poker coaching that helps you improve one decision at a time.",
    siteName: "Kevixo",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kevixo - Every Hand Makes You Better.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kevixo | Every Hand Makes You Better.",
    description: "AI-powered poker coaching that helps you improve one decision at a time.",
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
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
