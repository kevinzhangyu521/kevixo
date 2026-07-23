"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile-client";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isLoginActive = pathname === "/login";
  const isSignUpActive = pathname === "/signup";
  const isResetPasswordRoute = pathname === "/reset-password";

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
    router.push("/");
    router.refresh();
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2 md:gap-3">
        {isAdmin ? (
          <Link
            href="/admin"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-200 hover:bg-slate-900/45 hover:text-slate-200",
              pathname.startsWith("/admin") ? "bg-slate-900/55 text-slate-50" : "text-slate-500",
            )}
          >
            Admin
          </Link>
        ) : null}
        <Link
          href="/account"
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-200 hover:bg-slate-900/45 hover:text-slate-200",
            pathname === "/account" ? "bg-slate-900/55 text-slate-50" : "text-slate-500",
          )}
        >
          Account
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-slate-500 transition hover:text-slate-200"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 md:gap-1.5">
      {pathname !== "/signup" ? (
        <AuthNavLink href="/login" active={isLoginActive}>
          Login
        </AuthNavLink>
      ) : null}
      {pathname !== "/login" && !isResetPasswordRoute ? (
        <AuthNavLink href="/signup" active={isSignUpActive}>
          Sign up
        </AuthNavLink>
      ) : null}
      {pathname === "/login" ? (
        <AuthNavLink href="/signup" active={false}>
          Sign up
        </AuthNavLink>
      ) : null}
    </div>
  );
}

async function refreshAdminStatus() {
  try {
    const profile = await getCurrentUserProfile();

    return profile?.role === "admin";
  } catch {
    return false;
  }
}

function AuthNavLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-200 hover:bg-slate-900/45 hover:text-slate-200",
        active ? "bg-slate-900/55 text-slate-50" : "text-slate-500",
      )}
    >
      {children}
    </Link>
  );
}
