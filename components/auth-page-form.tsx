"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/profile-client";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

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
  },
  "sign-up": {
    eyebrow: "Create Account",
    title: "Start your Kevixo account",
    description: "Create an account to keep your poker study history connected.",
    status: "Create one account for reviews, progress, and billing.",
    submit: "Create Account",
    submitting: "Creating your account...",
  },
  reset: {
    eyebrow: "Password Reset",
    title: "Reset your password",
    description: "Enter your email and Kevixo will send you a password reset link.",
    status: "Enter your email and we will send you a password reset link.",
    submit: "Send reset link",
    submitting: "Sending password reset email...",
  },
} satisfies Record<AuthMode, Record<string, string>>;

export function AuthPageForm({ mode }: AuthPageFormProps) {
  const router = useRouter();
  const copy = authCopy[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(copy.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPasswordRequired = mode !== "reset";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus("Accounts are not configured yet.");
      return;
    }

    setIsSubmitting(true);
    setStatus(copy.submitting);

    try {
      const supabase = getSupabaseClient();

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
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : copy.submit}
          </Button>
        </form>

        <AuthPageLinks mode={mode} />

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
  );
}

function AuthPageLinks({ mode }: { mode: AuthMode }) {
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
      Remembered your password?{" "}
      <Link href="/login" className="font-semibold text-primary hover:text-sky-200">
        Back to login
      </Link>
    </p>
  );
}

function getRedirectPath() {
  if (typeof window === "undefined") {
    return "/review";
  }

  return new URLSearchParams(window.location.search).get("redirect") ?? "/review";
}
