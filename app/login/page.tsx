"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Use one account for reviews, progress, and billing.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus("Accounts are not configured yet.");
      return;
    }

    setIsSubmitting(true);
    setStatus(mode === "sign-in" ? "Signing you in..." : "Creating your account...");

    try {
      const supabase = getSupabaseClient();
      const auth =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (auth.error) {
        throw new Error(auth.error.message);
      }

      if (!auth.data.session && mode === "sign-up") {
        setStatus("Account created. Check your email if confirmation is enabled, then sign in.");
        return;
      }

      router.push(getRedirectPath());
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Account action failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Pricing" ctaHref="/pricing" />

      <section className="mx-auto w-full max-w-xl px-5 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Kevixo Account
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Continue your poker improvement
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Save your reviews, manage Coach, and keep your progress tied to one account.
          </p>
        </div>

        <Card className="mt-8 p-5 md:p-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/48 p-1">
            <AuthModeButton active={mode === "sign-in"} onClick={() => setMode("sign-in")}>
              Sign In
            </AuthModeButton>
            <AuthModeButton active={mode === "sign-up"} onClick={() => setMode("sign-up")}>
              Create Account
            </AuthModeButton>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-primary/50"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                minLength={6}
                className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-primary/50"
              />
            </label>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : mode === "sign-in" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-5 text-sm leading-6 text-slate-400">{status}</p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            By continuing, you agree to Kevixo&apos;s{" "}
            <Link href="/terms" className="text-slate-300 hover:text-primary">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-slate-300 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </Card>
      </section>
    </main>
  );
}

function getRedirectPath() {
  if (typeof window === "undefined") {
    return "/review";
  }

  return new URLSearchParams(window.location.search).get("redirect") ?? "/review";
}

function AuthModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-semibold transition",
        active ? "bg-primary text-slate-950" : "text-slate-400 hover:text-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
