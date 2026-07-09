import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  ctaLabel?: string;
  ctaHref?: string;
  larger?: boolean;
};

export function SiteHeader({
  ctaHref = "/import",
  ctaLabel = "Import Hand",
  larger = false,
}: SiteHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:py-8">
      <Link href="/" className="flex items-center gap-3" aria-label="Kevixo home">
        <Image
          src="/brand/kevixo-logo.svg"
          alt="Kevixo"
          width={720}
          height={160}
          priority={larger}
          className={cn(
            "h-9 w-auto",
            larger ? "h-11" : "h-9",
          )}
        />
        <span className="sr-only">Kevixo</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/poker-hand-analyzer"
          className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-200 md:inline-flex"
        >
          Analyzer
        </Link>
        <Link
          href="/my-reviews"
          className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-200 md:inline-flex"
        >
          My Reviews
        </Link>
        <Link
          href="/profile"
          className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-200 lg:inline-flex"
        >
          Profile
        </Link>
        <Link
          href="/progress"
          className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-200 lg:inline-flex"
        >
          Progress
        </Link>
        <Link
          href="/blog"
          className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-200 sm:inline-flex"
        >
          Blog
        </Link>
        <Link
          href={ctaHref}
          className="rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-slate-50 hover:shadow-[0_0_28px_rgba(59,201,255,0.12)]"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
