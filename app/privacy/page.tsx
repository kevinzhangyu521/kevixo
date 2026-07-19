import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy | Kevixo",
  description: "Kevixo privacy overview for AI poker hand review users.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Privacy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
          Kevixo Privacy
        </h1>
        <Card className="mt-8 p-5 md:p-6">
          <CardTitle>Simple product privacy</CardTitle>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400">
            <p>
              Kevixo is built as a lightweight AI poker hand review tool. You can use
              the core review experience without an account, and you can create an
              account when you want your reviews, progress, and future subscription
              connected to one identity.
            </p>
            <p>
              Submitted hand histories and feedback may be stored so Kevixo can show
              review results, improve product quality, and help the founder understand
              user issues. Do not paste sensitive personal information into a hand
              history.
            </p>
            <p>
              Feedback may include optional email if you choose to provide it. If you
              want to ask about data or product feedback, contact{" "}
              <a className="text-primary" href="mailto:hello@kevixo.com">
                hello@kevixo.com
              </a>
              .
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
