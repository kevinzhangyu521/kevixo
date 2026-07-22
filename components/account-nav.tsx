"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const mode = searchParams.get("mode");
  const isLoginActive = pathname === "/login" && mode !== "sign-up";
  const isSignUpActive = pathname === "/signup" || (pathname === "/login" && mode === "sign-up");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseClient();

    void supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    if (!isSupabaseConfigured) {
      return;
    }

    await getSupabaseClient().auth.signOut();
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2 md:gap-3">
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
      <Link
        href="/login"
        aria-current={isLoginActive ? "page" : undefined}
        className={cn(
          "rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-200 hover:bg-slate-900/45 hover:text-slate-200",
          isLoginActive ? "bg-slate-900/55 text-slate-50" : "text-slate-500",
        )}
      >
        Login
      </Link>
      <Link
        href="/login?mode=sign-up"
        aria-current={isSignUpActive ? "page" : undefined}
        className={cn(
          "rounded-lg px-2.5 py-1.5 text-sm font-medium transition duration-200 hover:bg-slate-900/45 hover:text-slate-200",
          isSignUpActive ? "bg-slate-900/55 text-slate-50" : "text-slate-500",
        )}
      >
        Sign up
      </Link>
    </div>
  );
}
