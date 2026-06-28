import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kevixo | Master Every Decision",
  description: "AI poker hand analyzer for actionable coaching reports.",
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
