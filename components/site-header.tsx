"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getCurrentUserProfile } from "@/lib/profile-client";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
  larger?: boolean;
};

const primaryNavigationItems = [
  { label: "Analyzer", href: "/review", match: ["/review"] },
  { label: "Pricing", href: "/pricing", match: ["/pricing"] },
  { label: "Blog", href: "/blog", match: ["/blog"] },
  { label: "About", href: "/about", match: ["/about"] },
];

const userNavigationItems = [
  { label: "My Reviews", href: "/my-reviews", match: ["/my-reviews"] },
  { label: "Progress", href: "/progress", match: ["/progress"] },
  { label: "Daily", href: "/daily", match: ["/daily"] },
  { label: "Profile", href: "/profile", match: ["/profile"] },
];

const adminNavigationItem = { label: "Admin", href: "/admin", match: ["/admin"] };

const visibilityByLabel: Record<string, string> = {
  Analyzer: "lg:inline-flex",
  Pricing: "lg:inline-flex",
  Blog: "sm:inline-flex",
  About: "lg:inline-flex",
  "My Reviews": "xl:inline-flex",
  Progress: "xl:inline-flex",
  Daily: "xl:inline-flex",
  Profile: "xl:inline-flex",
  Admin: "inline-flex",
};

export function SiteHeader({
  ctaHref = "/import",
  ctaLabel = "Analyze My Hand",
  larger = false,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" || pathname === "/signup" || pathname === "/reset-password";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseClient();

    void supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
      if (data.session) {
        void refreshAdminStatus().then(setIsAdmin);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      if (session) {
        void refreshAdminStatus().then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:py-8">
      <Link
        href="/"
        className={cn(
          "flex shrink-0 items-center gap-3",
          larger ? "w-[156px] md:w-[172px]" : "w-[132px] md:w-[148px]",
        )}
        aria-label="Kevixo home"
      >
        <Image
          src="/brand/kevixo-logo.svg"
          alt="Kevixo"
          width={720}
          height={160}
          priority={larger}
          className={cn(
            "shrink-0 object-contain",
            larger ? "h-11" : "h-9",
          )}
        />
        <span className="sr-only">Kevixo</span>
      </Link>
      <div className="flex items-center gap-2 md:gap-3">
        {!isAuthRoute ? (
          <nav className="flex items-center gap-1 md:gap-1.5" aria-label="Primary navigation">
            {primaryNavigationItems.map((item) => (
              <NavigationLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        ) : null}
        {isLoggedIn && !isAuthRoute ? (
          <nav className="hidden items-center gap-1 border-l border-slate-800/80 pl-2 xl:flex">
            {userNavigationItems.map((item) => (
              <NavigationLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        ) : null}
        {isLoggedIn && isAdmin && !isAuthRoute ? (
          <nav className="flex items-center gap-1" aria-label="Admin navigation">
            <NavigationLink item={adminNavigationItem} pathname={pathname} />
          </nav>
        ) : null}
        {!isAuthRoute ? (
          <Link
            href="/pricing"
            className="hidden whitespace-nowrap rounded-xl border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/15 md:inline-flex"
          >
            Upgrade
          </Link>
        ) : null}
        <Suspense fallback={null}>
          <AccountNav />
        </Suspense>
        {!isAuthRoute ? (
          <Link
            href={ctaHref}
            className="whitespace-nowrap rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-slate-50 hover:shadow-[0_0_28px_rgba(59,201,255,0.12)]"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

async function refreshAdminStatus() {
  try {
    const profile = await getCurrentUserProfile();

    return profile?.role === "admin" && profile.status === "active";
  } catch {
    return false;
  }
}

type NavigationItem = {
  label: string;
  href: string;
  match: string[];
};

function NavigationLink({ item, pathname }: { item: NavigationItem; pathname: string }) {
  const isActive = item.match.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "hidden rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-200 hover:bg-slate-900/45 hover:text-slate-200",
        visibilityByLabel[item.label],
        isActive ? "bg-slate-900/55 text-slate-50" : "text-slate-500",
      )}
    >
      {item.label}
    </Link>
  );
}
