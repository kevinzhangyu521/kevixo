"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  { label: "My Reviews", href: "/my-reviews", match: ["/my-reviews"] },
  { label: "Progress", href: "/progress", match: ["/progress"] },
  { label: "Daily", href: "/daily", match: ["/daily"] },
];

const secondaryNavigationItems = [
  { label: "Pricing", href: "/pricing", match: ["/pricing"] },
  { label: "Blog", href: "/blog", match: ["/blog"] },
  { label: "About", href: "/about", match: ["/about"] },
];

const adminNavigationItem = { label: "Admin", href: "/admin", match: ["/admin"] };

const profileNavigationItem = { label: "Profile", href: "/profile", match: ["/profile"] };

const mobileNavigationItems = [
  ...primaryNavigationItems,
  profileNavigationItem,
  ...secondaryNavigationItems,
];

const visibilityByLabel: Record<string, string> = {
  Analyzer: "inline-flex",
  "My Reviews": "inline-flex",
  Progress: "inline-flex",
  Daily: "inline-flex",
};

export function SiteHeader({
  ctaHref = "/import",
  ctaLabel = "Analyze My Hand",
  larger = false,
}: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const primaryDesktopItems = isLoggedIn
    ? [...primaryNavigationItems, profileNavigationItem]
    : primaryNavigationItems;

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

  async function handleLogout() {
    if (!isSupabaseConfigured) {
      return;
    }

    await getSupabaseClient().auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="w-full overflow-x-clip px-5 py-5 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4 xl:hidden">
          <BrandLink larger={larger} />
          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-controls="kevixo-mobile-menu"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-slate-900/70 active:scale-[0.97]"
          >
            <span className="sr-only">{isMobileMenuOpen ? "Close menu" : "Open menu"}</span>
            <span className="grid gap-1.5" aria-hidden="true">
              <span
                className={cn(
                  "block h-0.5 w-5 rounded-full bg-current transition",
                  isMobileMenuOpen ? "translate-y-2 rotate-45" : "",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 rounded-full bg-current transition",
                  isMobileMenuOpen ? "opacity-0" : "",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 rounded-full bg-current transition",
                  isMobileMenuOpen ? "-translate-y-2 -rotate-45" : "",
                )}
              />
            </span>
          </button>
        </div>

        <div
          className={cn(
            "hidden w-full items-center gap-4 xl:grid",
            larger
              ? "grid-cols-[172px_minmax(0,1fr)_480px]"
              : "grid-cols-[148px_minmax(0,1fr)_480px]",
          )}
        >
          <BrandLink larger={larger} />

          <div className="flex min-w-0 justify-center">
            <nav
              className="flex min-w-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-slate-900/70 bg-slate-950/20 px-1 py-1"
              aria-label="Main navigation"
            >
              {primaryDesktopItems.map((item) => (
                <NavigationLink key={item.href} item={item} pathname={pathname} />
              ))}
              <MoreNavigation
                isOpen={isMoreMenuOpen}
                items={secondaryNavigationItems}
                onOpenChange={setIsMoreMenuOpen}
                pathname={pathname}
              />
            </nav>
          </div>

          <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
            <div className="flex w-[68px] shrink-0 justify-end">
              {isLoggedIn && isAdmin ? (
                <ActionLink href={adminNavigationItem.href}>Admin</ActionLink>
              ) : null}
            </div>
            <Link
              href="/pricing"
              className="whitespace-nowrap rounded-xl border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/15 active:scale-[0.98]"
            >
              Upgrade
            </Link>
            <HeaderAccountActions
              isLoggedIn={isLoggedIn}
              onLogout={handleLogout}
              pathname={pathname}
            />
            <Link
              href={ctaHref}
              className="whitespace-nowrap rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-slate-50 hover:shadow-[0_0_28px_rgba(59,201,255,0.12)] active:scale-[0.98]"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>

        <div
          id="kevixo-mobile-menu"
          className={cn(
            "xl:hidden",
            isMobileMenuOpen ? "mt-4 grid gap-4" : "hidden",
          )}
        >
          <nav
            className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/92 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
            aria-label="Mobile navigation"
          >
            {mobileNavigationItems.map((item) => (
              <MobileNavigationLink
                key={item.href}
                item={item}
                onNavigate={() => setIsMobileMenuOpen(false)}
                pathname={pathname}
              />
            ))}
            {isLoggedIn && isAdmin ? (
              <MobileActionLink href="/admin" onNavigate={() => setIsMobileMenuOpen(false)}>
                Admin
              </MobileActionLink>
            ) : null}
          </nav>

          <div className="grid gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
            <MobileActionLink href="/pricing" onNavigate={() => setIsMobileMenuOpen(false)}>
              Upgrade
            </MobileActionLink>
            <HeaderAccountActions
              isLoggedIn={isLoggedIn}
              mobile
              onNavigate={() => setIsMobileMenuOpen(false)}
              onLogout={handleLogout}
              pathname={pathname}
            />
            <MobileActionLink href={ctaHref} onNavigate={() => setIsMobileMenuOpen(false)}>
              {ctaLabel}
            </MobileActionLink>
          </div>
        </div>
      </div>
    </header>
  );
}

function BrandLink({ larger }: { larger: boolean }) {
  return (
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
  );
}

function HeaderAccountActions({
  isLoggedIn,
  mobile = false,
  onNavigate,
  onLogout,
  pathname,
}: {
  isLoggedIn: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
  pathname: string;
}) {
  const isResetPasswordRoute = pathname === "/reset-password";

  if (isLoggedIn) {
    return mobile ? (
      <div className="grid gap-2">
        <MobileActionLink href="/account" onNavigate={onNavigate}>
          Account
        </MobileActionLink>
        <MobileActionButton onClick={onLogout}>Logout</MobileActionButton>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <ActionLink href="/account">Account</ActionLink>
        <ActionButton onClick={onLogout}>Logout</ActionButton>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className="grid gap-2">
        {pathname !== "/signup" ? (
          <MobileActionLink href="/login" onNavigate={onNavigate}>
            Login
          </MobileActionLink>
        ) : null}
        {pathname !== "/login" && !isResetPasswordRoute ? (
          <MobileActionLink href="/signup" onNavigate={onNavigate}>
            Sign up
          </MobileActionLink>
        ) : null}
        {pathname === "/login" ? (
          <MobileActionLink href="/signup" onNavigate={onNavigate}>
            Sign up
          </MobileActionLink>
        ) : null}
        {isResetPasswordRoute ? (
          <MobileActionLink href="/login" onNavigate={onNavigate}>
            Login
          </MobileActionLink>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {pathname !== "/signup" ? <ActionLink href="/login">Login</ActionLink> : null}
      {pathname !== "/login" && !isResetPasswordRoute ? (
        <ActionLink href="/signup">Sign up</ActionLink>
      ) : null}
      {pathname === "/login" ? <ActionLink href="/signup">Sign up</ActionLink> : null}
      {isResetPasswordRoute ? <ActionLink href="/login">Login</ActionLink> : null}
    </div>
  );
}

function ActionLink({ children, href }: { children: string; href: string }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:border-slate-800 hover:bg-slate-900/55 hover:text-slate-100 active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}

function ActionButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:border-slate-800 hover:bg-slate-900/55 hover:text-slate-100 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function MobileActionLink({
  children,
  href,
  onNavigate,
}: {
  children: string;
  href: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-slate-200 transition duration-200 hover:border-primary/35 hover:bg-slate-900/70 active:scale-[0.99]"
    >
      {children}
    </Link>
  );
}

function MobileActionButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-left text-sm font-semibold text-slate-200 transition duration-200 hover:border-primary/35 hover:bg-slate-900/70 active:scale-[0.99]"
    >
      {children}
    </button>
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

function MoreNavigation({
  isOpen,
  items,
  onOpenChange,
  pathname,
}: {
  isOpen: boolean;
  items: NavigationItem[];
  onOpenChange: (isOpen: boolean) => void;
  pathname: string;
}) {
  const isActive = items.some((item) =>
    item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`)),
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => onOpenChange(!isOpen)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
            onOpenChange(false);
          }
        }}
        className={cn(
          "inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-slate-900/70 hover:text-slate-100 hover:shadow-[0_10px_30px_rgba(15,23,42,0.28)] active:scale-[0.97]",
          isActive
            ? "border-primary/30 bg-primary/10 text-sky-100 shadow-[0_0_24px_rgba(59,201,255,0.14)]"
            : "border-transparent text-slate-500",
        )}
      >
        More
      </button>
      {isOpen ? (
        <div
          className="absolute right-0 top-full z-30 mt-2 grid min-w-36 gap-1 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
          role="menu"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:bg-slate-900/80 hover:text-slate-50 active:scale-[0.98]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileNavigationLink({
  item,
  onNavigate,
  pathname,
}: {
  item: NavigationItem;
  onNavigate: () => void;
  pathname: string;
}) {
  const isActive = item.match.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-semibold transition duration-200 hover:border-primary/35 hover:bg-slate-900/70 active:scale-[0.99]",
        isActive
          ? "border-primary/35 bg-primary/10 text-sky-100 shadow-[0_0_24px_rgba(59,201,255,0.14)]"
          : "border-slate-800 bg-slate-950/40 text-slate-300",
      )}
    >
      {item.label}
    </Link>
  );
}
