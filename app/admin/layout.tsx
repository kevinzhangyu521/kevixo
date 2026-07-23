import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founder Dashboard | Kevixo",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
