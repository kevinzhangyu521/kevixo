"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseClient, getSupabaseConfigurationError, isSupabaseConfigured } from "@/lib/supabase";

type CallbackState = "checking" | "success" | "error";

export function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>("checking");
  const [message, setMessage] = useState("Confirming your Kevixo account...");

  useEffect(() => {
    async function confirmEmail() {
      if (!isSupabaseConfigured) {
        setState("error");
        setMessage(getSupabaseConfigurationError() ?? "Kevixo account confirmation is not available right now.");
        return;
      }

      const code = searchParams.get("code");

      if (!code) {
        setState("error");
        setMessage("This confirmation link is missing a required code. Please request a new sign-in link.");
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw new Error(error.message);
        }

        setState("success");
        setMessage("Your email is confirmed. Taking you to your Kevixo account...");

        window.setTimeout(() => {
          router.replace("/account");
          router.refresh();
        }, 700);
      } catch (error) {
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "We could not confirm your account. Please try signing in again.",
        );
      }
    }

    void confirmEmail();
  }, [router, searchParams]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-16">
      <Card className="w-full p-6 text-center md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Email Confirmation
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
          {state === "error" ? "Confirmation needs another try" : "Confirming your account"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400" role="status" aria-live="polite">
          {message}
        </p>
        {state === "error" ? (
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
