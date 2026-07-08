import type { Metadata } from "next";

const title = "Import Hand | Kevixo";
const description =
  "Import a poker hand with screenshot upload, pasted hand history, or a manual builder.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/import",
  },
  openGraph: {
    title,
    description,
    url: "https://www.kevixo.com/import",
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
    title,
    description,
    images: ["/brand/og-image.png"],
  },
};

export default function ImportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
