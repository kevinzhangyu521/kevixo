import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms | Kevixo",
  description: "Kevixo terms overview for AI poker hand review users.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Terms
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
          Kevixo Terms
        </h1>
        <Card className="mt-8 p-5 md:p-6">
          <CardTitle>Use Kevixo as a coaching aid</CardTitle>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400">
            <p>
              Kevixo provides AI-generated poker coaching for educational purposes.
              It is not a guarantee of outcomes, a betting platform, or a replacement
              for your own judgment during study or gameplay.
            </p>
            <p>
              Poker decisions depend on incomplete information, player tendencies,
              stack depth, and hand history quality. Kevixo works best when you provide
              complete and accurate hand details.
            </p>
            <p>
              By using Kevixo, you agree to use the product responsibly and understand
              that review outputs are coaching guidance, not financial advice.
            </p>
          </div>
        </Card>
        <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-primary">
          Back to Kevixo
        </Link>
      </section>
    </main>
  );
}
