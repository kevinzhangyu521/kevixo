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
    <header className="w-full px-5 py-6 md:py-8">
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl items-center gap-3 md:gap-4",
          larger
            ? "grid-cols-[156px_minmax(0,1fr)_auto] md:grid-cols-[172px_minmax(0,1fr)_auto]"
            : "grid-cols-[132px_minmax(0,1fr)_auto] md:grid-cols-[148px_minmax(0,1fr)_auto]",
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center gap-3 justify-self-start",
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
            className={cn("shrink-0 object-contain", larger ? "h-11" : "h-9")}
          />
          <span className="sr-only">Kevixo</span>
        </Link>

        <div className="flex min-w-0 justify-center">
          {!isAuthRoute ? (
            <nav
              className="flex min-w-0 items-center justify-center gap-1 rounded-full border border-slate-900/70 bg-slate-950/20 px-1 py-1 md:gap-1.5"
              aria-label="Primary navigation"
            >
              {primaryNavigationItems.map((item) => (
                <NavigationLink key={item.href} item={item} pathname={pathname} />
              ))}
              {isLoggedIn ? (
                <>
                  <span className="hidden h-5 w-px bg-slate-800/80 xl:block" aria-hidden="true" />
                  {userNavigationItems.map((item) => (
                    <NavigationLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 md:gap-3">
          {!isAuthRoute ? (
            <div className="hidden w-[68px] justify-end lg:flex">
              {isLoggedIn && isAdmin ? (
                <NavigationLink item={adminNavigationItem} pathname={pathname} />
              ) : null}
            </div>
          ) : null}
          {!isAuthRoute ? (
            <Link
              href="/pricing"
              className="hidden whitespace-nowrap rounded-xl border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/15 active:scale-[0.98] md:inline-flex"
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
              className="whitespace-nowrap rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-slate-50 hover:shadow-[0_0_28px_rgba(59,201,255,0.12)] active:scale-[0.98]"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
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
        "hidden rounded-full border px-3 py-1.5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-slate-900/70 hover:text-slate-100 hover:shadow-[0_10px_30px_rgba(15,23,42,0.28)] active:scale-[0.97]",
        visibilityByLabel[item.label],
        isActive
          ? "border-primary/30 bg-primary/10 text-sky-100 shadow-[0_0_24px_rgba(59,201,255,0.14)]"
          : "border-transparent text-slate-500",
      )}
    >
      {item.label}
    </Link>
  );
}
