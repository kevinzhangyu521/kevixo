import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Try Free ->" />
      <section className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-3xl flex-col items-start justify-center px-5 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-4 text-5xl font-semibold leading-tight text-slate-50 md:text-6xl">
          This page does not exist.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          The route you opened is not part of Kevixo. Start from the homepage or review a hand.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-300"
          >
            Go Home
          </Link>
          <Link
            href="/review"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 px-5 py-2.5 text-sm font-semibold text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-slate-50"
          >
            Analyze a Hand
          </Link>
        </div>
      </section>
    </main>
  );
}
