"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
  larger?: boolean;
};

const navigationItems = [
  { label: "Analyzer", href: "/review", match: ["/review"] },
  { label: "My Reviews", href: "/my-reviews", match: ["/my-reviews"] },
  { label: "Profile", href: "/profile", match: ["/profile"] },
  { label: "Progress", href: "/progress", match: ["/progress"] },
  { label: "Daily", href: "/daily", match: ["/daily"] },
  { label: "Pricing", href: "/pricing", match: ["/pricing"] },
  { label: "About", href: "/about", match: ["/about"] },
  { label: "Blog", href: "/blog", match: ["/blog"] },
];

const visibilityByLabel: Record<string, string> = {
  Analyzer: "md:inline-flex",
  "My Reviews": "md:inline-flex",
  Profile: "lg:inline-flex",
  Progress: "lg:inline-flex",
  Daily: "lg:inline-flex",
  Pricing: "md:inline-flex",
  About: "md:inline-flex",
  Blog: "sm:inline-flex",
};

export function SiteHeader({
  ctaHref = "/import",
  ctaLabel = "Import Hand",
  larger = false,
}: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:py-8">
      <Link href="/" className="flex items-center gap-3" aria-label="Kevixo home">
        <Image
          src="/brand/kevixo-logo.svg"
          alt="Kevixo"
          width={720}
          height={160}
          priority={larger}
          className={cn(
            "h-9 w-auto",
            larger ? "h-11" : "h-9",
          )}
        />
        <span className="sr-only">Kevixo</span>
      </Link>
      <div className="flex items-center gap-4">
        {navigationItems.map((item) => {
          const isActive = item.match.some(
            (path) => pathname === path || pathname.startsWith(`${path}/`),
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "hidden rounded-xl border px-3 py-1.5 text-sm font-medium transition duration-200 hover:border-primary/30 hover:bg-slate-900/45 hover:text-slate-200",
                visibilityByLabel[item.label],
                isActive
                  ? "border-primary/30 bg-primary/10 text-primary shadow-[0_0_18px_rgba(59,201,255,0.08)]"
                  : "border-transparent text-slate-500",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/pricing"
          className="hidden rounded-xl border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/15 md:inline-flex"
        >
          Upgrade
        </Link>
        <AccountNav />
        <Link
          href={ctaHref}
          className="rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-slate-50 hover:shadow-[0_0_28px_rgba(59,201,255,0.12)]"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
