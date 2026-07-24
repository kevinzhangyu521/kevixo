import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AuthDebugPanel } from "./auth-debug-panel";

export const metadata: Metadata = {
  title: "Auth Debug | Kevixo",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthDebugPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Review" ctaHref="/review" />
      <section className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Debug
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          Auth Diagnostics
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
          Temporary client-side diagnostics for Supabase auth and profile loading.
        </p>
        <AuthDebugPanel />
      </section>
    </main>
  );
}
