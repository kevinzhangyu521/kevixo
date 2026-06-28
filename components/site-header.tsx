import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  ctaLabel?: string;
  larger?: boolean;
};

export function SiteHeader({ ctaLabel = "Review", larger = false }: SiteHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:py-8">
      <Link href="/" className="flex items-center gap-3" aria-label="Kevixo home">
        <span
          className={cn(
            "flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950 text-sm font-bold text-primary shadow-[0_0_30px_rgba(59,201,255,0.08)]",
            larger ? "size-11 text-base" : "size-9",
          )}
        >
          K
        </span>
        <span>
          <span className={cn("block font-semibold text-slate-50", larger ? "text-base" : "text-sm")}>
            Kevixo
          </span>
          <span className="block text-xs text-slate-600">Master Every Decision</span>
        </span>
      </Link>
      <Link
        href="/review"
        className="rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-slate-50 hover:shadow-[0_0_28px_rgba(59,201,255,0.12)]"
      >
        {ctaLabel}
      </Link>
    </header>
  );
}
