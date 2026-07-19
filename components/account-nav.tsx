"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export function AccountNav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
          className="text-sm font-medium text-slate-500 transition hover:text-slate-200"
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
      <div className="flex items-center gap-2 md:gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-200"
      >
        Login
      </Link>
      <Link
        href="/login?mode=sign-up"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-200"
      >
        Sign up
      </Link>
    </div>
  );
}
