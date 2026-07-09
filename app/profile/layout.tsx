import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Profile | Kevixo",
  description: "Track your Kevixo poker review trends and coaching profile.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
