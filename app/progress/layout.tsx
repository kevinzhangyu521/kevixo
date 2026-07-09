import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly Progress | Kevixo",
  description: "Review your weekly Kevixo poker improvement report.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProgressLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
