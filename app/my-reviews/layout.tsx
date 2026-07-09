import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Reviews | Kevixo",
  description: "Revisit and manage your saved Kevixo poker hand reviews.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyReviewsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
