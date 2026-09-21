import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardTitle } from "@/components/ui/card";

const siteUrl = "https://www.kevixo.com";

export const metadata: Metadata = {
  title: "Refund Policy | Kevixo",
  description: "Kevixo refund policy for digital software and service access.",
  alternates: {
    canonical: `${siteUrl}/refund-policy`,
  },
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Refund Policy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
          Refund Policy
        </h1>
        <Card className="mt-8 p-5 md:p-6">
          <CardTitle>Refunds for digital services</CardTitle>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400">
            <p>
              Kevixo sells access to digital software and services for poker hand review
              and coaching.
            </p>
            <p>
              For purchases processed through Paddle, Paddle is the Merchant of Record.
              Refund requests are handled subject to Paddle&apos;s applicable checkout and
              refund terms and applicable consumer law.
            </p>
            <p>Nothing in this policy limits statutory consumer rights.</p>
            <p>
              For questions about a Paddle billing charge or refund request, contact{" "}
              <a className="text-primary" href="mailto:support@kevixo.com">
                support@kevixo.com
              </a>
              .
            </p>
          </div>
        </Card>
        <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-primary">
          Back to Kevixo
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
