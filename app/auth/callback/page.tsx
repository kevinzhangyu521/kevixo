import { Suspense } from "react";
import { AuthCallbackContent } from "./auth-callback-content";

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<AuthCallbackFallback />}>
        <AuthCallbackContent />
      </Suspense>
    </main>
  );
}

function AuthCallbackFallback() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-16">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Email Confirmation
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
          Confirming your account
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Confirming your Kevixo account...
        </p>
      </div>
    </section>
  );
}
