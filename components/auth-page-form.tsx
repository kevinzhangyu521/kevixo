"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/profile-client";
import {
  getSupabaseClient,
  getSupabaseConfigurationError,
  isSupabaseConfigured,
} from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up" | "reset";

type AuthPageFormProps = {
  mode: AuthMode;
};

const authCopy = {
  "sign-in": {
    eyebrow: "Kevixo Account",
    title: "Welcome back",
    description: "Sign in to keep your reviews, progress, and Coach access connected.",
    status: "Use one account for reviews, progress, and billing.",
    submit: "Sign In",
    submitting: "Signing you in...",
    loadingSubmit: "Signing in...",
  },
  "sign-up": {
    eyebrow: "Create Account",
    title: "Start your Kevixo account",
    description: "Create an account to keep your poker study history connected.",
    status: "Create one account for reviews, progress, and billing.",
    submit: "Create Account",
    submitting: "Creating your account...",
    loadingSubmit: "Creating account...",
  },
  reset: {
    eyebrow: "Password Reset",
    title: "Reset your password",
    description: "Enter your email and Kevixo will send you a password reset link.",
    status: "Enter your email and we will send you a password reset link.",
    submit: "Send reset link",
    submitting: "Sending password reset email...",
    loadingSubmit: "Sending reset link...",
  },
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthPageForm({ mode }: AuthPageFormProps) {
  const router = useRouter();
  const copy = authCopy[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(copy.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const isPasswordRequired = mode !== "reset" || isPasswordRecovery;

  useEffect(() => {
    if (mode !== "reset") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const hasRecoveryHash =
        window.location.hash.includes("type=recovery") ||
        window.location.search.includes("type=recovery");

      if (hasRecoveryHash) {
        setIsPasswordRecovery(true);
        setStatus("Enter a new password for your Kevixo account.");
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus(getSupabaseConfigurationError() ?? "Supabase public config is not available.");
      return;
    }

    setIsSubmitting(true);
    setStatus(getSubmittingStatus(mode, isPasswordRecovery));

    try {
      const supabase = getSupabaseClient();

      if (mode === "reset" && isPasswordRecovery) {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          throw new Error(error.message);
        }

        setStatus("Password updated. You can now continue using Kevixo.");
        window.setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 800);
        return;
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          throw new Error(error.message);
        }

        setStatus("Password reset email sent. Check your inbox for the next step.");
        return;
      }

      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${getPublicSiteUrl()}/auth/callback`,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.session) {
          setStatus("Account created. You are signed in and ready to continue.");

          try {
            await ensureUserProfile();
          } catch (profileError) {
            console.warn("Kevixo profile setup failed.", profileError);
            setStatus("Account setup failed. Please try again.");
            return;
          }

          window.setTimeout(() => {
            router.push(getRedirectPath());
            router.refresh();
          }, 800);
          return;
        }

        setStatus("Account created. Check your email to confirm your account.");
        return;
      }

      const auth =
        await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (auth.error) {
        throw new Error(auth.error.message);
      }

      if (!auth.data.session) {
        setStatus("Sign in completed, but no active session was returned. Please try again.");
        return;
      }

      const { data: persistedSession } = await supabase.auth.getSession();

      if (!persistedSession.session) {
        setStatus("Sign in completed, but the browser session was not saved. Please try again.");
        return;
      }

      try {
        await ensureUserProfile();
      } catch (profileError) {
        console.warn("Kevixo profile setup failed.", profileError);
        setStatus("Account setup failed. Please try again.");
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
    <section className="mx-auto w-full max-w-xl px-5 pb-16 pt-8 md:pb-24 md:pt-12">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">{copy.description}</p>
      </div>

      <Card className="mt-8 p-5 md:p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
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
          {isPasswordRequired ? (
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              {isPasswordRecovery ? "New password" : "Password"}
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
            {isSubmitting ? copy.loadingSubmit : getSubmitLabel(mode, isPasswordRecovery)}
          </Button>
        </form>

        <AuthPageLinks mode={mode} isPasswordRecovery={isPasswordRecovery} />

        <p className="mt-5 text-sm leading-6 text-slate-400" role="status" aria-live="polite">
          {status}
        </p>
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
  );
}

function AuthPageLinks({
  isPasswordRecovery,
  mode,
}: {
  isPasswordRecovery: boolean;
  mode: AuthMode;
}) {
  if (mode === "sign-in") {
    return (
      <div className="mt-5 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/reset-password" className="hover:text-primary">
          Forgot password
        </Link>
        <Link href="/signup" className="font-semibold text-primary hover:text-sky-200">
          Create account
        </Link>
      </div>
    );
  }

  if (mode === "sign-up") {
    return (
      <p className="mt-5 text-sm text-slate-400">
        Already have account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-sky-200">
          Sign in
        </Link>
      </p>
    );
  }

  return (
    <p className="mt-5 text-sm text-slate-400">
      {isPasswordRecovery ? "Want to sign in instead?" : "Remembered your password?"}{" "}
      <Link href="/login" className="font-semibold text-primary hover:text-sky-200">
        Back to login
      </Link>
    </p>
  );
}

function getSubmitLabel(mode: AuthMode, isPasswordRecovery: boolean) {
  if (mode === "reset" && isPasswordRecovery) {
    return "Update password";
  }

  return authCopy[mode].submit;
}

function getSubmittingStatus(mode: AuthMode, isPasswordRecovery: boolean) {
  if (mode === "reset" && isPasswordRecovery) {
    return "Updating your password...";
  }

  return authCopy[mode].submitting;
}

function getRedirectPath() {
  if (typeof window === "undefined") {
    return "/review";
  }

  return new URLSearchParams(window.location.search).get("redirect") ?? "/review";
}

function getPublicSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "https://www.kevixo.com";
}
