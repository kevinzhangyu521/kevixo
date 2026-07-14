import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function CoachWelcomePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Profile" ctaHref="/profile" />

      <section className="mx-auto flex w-full max-w-3xl px-5 pb-16 pt-12 md:pb-24 md:pt-20">
        <Card className="w-full border-primary/30 bg-primary/5 p-6 text-center md:p-10">
          <CardTitle>Kevixo Coach</CardTitle>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            Welcome to Kevixo Coach.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
            Your subscription is now active. Your personal coaching journey starts today.
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link href="/review">Continue Learning</Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
