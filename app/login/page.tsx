"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/profile-client";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up" | "reset" | "update-password";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Use one account for reviews, progress, and billing.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const modeParam = new URLSearchParams(window.location.search).get("mode");

      if (modeParam === "reset") {
        setMode("reset");
        setStatus("Enter your email and we will send you a password reset link.");
      }

      if (modeParam === "sign-up") {
        setMode("sign-up");
      }

      if (modeParam === "update-password" || window.location.hash.includes("type=recovery")) {
        setMode("update-password");
        setStatus("Enter a new password for your Kevixo account.");
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus("Accounts are not configured yet.");
      return;
    }

    setIsSubmitting(true);
    setStatus(getSubmittingMessage(mode));

    try {
      const supabase = getSupabaseClient();

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?mode=update-password`,
        });

        if (error) {
          throw new Error(error.message);
        }

        setStatus("Password reset email sent. Check your inbox for the next step.");
        return;
      }

      if (mode === "update-password") {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          throw new Error(error.message);
        }

        setStatus("Password updated. You can continue using Kevixo.");
        router.push(getRedirectPath());
        router.refresh();
        return;
      }

      const auth =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (auth.error) {
        throw new Error(auth.error.message);
      }

      if (auth.data.session) {
        await ensureUserProfile();
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
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-950/48 p-1">
            <AuthModeButton active={mode === "sign-in"} onClick={() => setMode("sign-in")}>
              Sign In
            </AuthModeButton>
            <AuthModeButton active={mode === "sign-up"} onClick={() => setMode("sign-up")}>
              Create Account
            </AuthModeButton>
            <AuthModeButton active={mode === "reset"} onClick={() => setMode("reset")}>
              Reset
            </AuthModeButton>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {mode !== "update-password" ? (
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
            ) : null}
            {mode !== "reset" ? (
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                {mode === "update-password" ? "New password" : "Password"}
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  minLength={6}
                  className="min-h-11 rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-slate-100 outline-none transition focus:border-primary/50"
                />
              </label>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : getSubmitLabel(mode)}
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

function getSubmittingMessage(mode: AuthMode) {
  if (mode === "sign-in") {
    return "Signing you in...";
  }

  if (mode === "sign-up") {
    return "Creating your account...";
  }

  if (mode === "reset") {
    return "Sending password reset email...";
  }

  return "Updating your password...";
}

function getSubmitLabel(mode: AuthMode) {
  if (mode === "sign-in") {
    return "Sign In";
  }

  if (mode === "sign-up") {
    return "Create Account";
  }

  if (mode === "reset") {
    return "Send Reset Email";
  }

  return "Update Password";
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
