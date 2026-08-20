import Link from "next/link";

const productLinks = [
  {
    label: "Analyzer",
    href: "/review",
    description: "Review a hand and get a clear coaching report.",
  },
  {
    label: "Pricing",
    href: "/pricing",
    description: "Compare free review tools with Kevixo Coach.",
  },
  {
    label: "Poker Hand Analyzer",
    href: "/poker-hand-analyzer",
    description: "Study key decisions with structured AI explanations.",
  },
  {
    label: "AI Poker Coach",
    href: "/ai-poker-coach",
    description: "Build a repeatable learning routine around reviewed hands.",
  },
  {
    label: "Poker Review Tool",
    href: "/poker-review-tool",
    description: "Turn one uncertain spot into a practical next step.",
  },
  {
    label: "Hand History Review",
    href: "/hand-history-review",
    description: "Learn from complete hand histories with clearer context.",
  },
  {
    label: "GTO Poker Coach",
    href: "/gto-poker-coach",
    description: "Connect range thinking to decisions you can practice.",
  },
  {
    label: "Poker Leak Finder",
    href: "/poker-leak-finder",
    description: "Spot repeated mistakes and create focused homework.",
  },
];

const learnLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Hand Review Guide", href: "/blog/how-to-review-poker-hands" },
  { label: "Hand History Guide", href: "/blog/poker-hand-history-guide" },
  { label: "AI Poker Coach Guide", href: "/blog/ai-poker-coach" },
  { label: "Poker Analysis Framework", href: "/blog/poker-hand-analysis-framework" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "mailto:support@kevixo.com" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-900 px-5 py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <p className="text-sm font-semibold text-slate-100">Kevixo</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
            Every Hand Makes You Better. Review decisions, study hands, and build better
            poker learning habits.
          </p>
        </div>

        <nav
          className="grid gap-8 sm:grid-cols-3"
          aria-label="Footer navigation"
        >
          <FooterLinkGroup title="Product" links={productLinks} showDescriptions />
          <FooterLinkGroup title="Learn" links={learnLinks} />
          <FooterLinkGroup title="Company" links={companyLinks} />
        </nav>
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  links,
  showDescriptions = false,
  title,
}: {
  links: Array<{ label: string; href: string; description?: string }>;
  showDescriptions?: boolean;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="mt-4 grid gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-transparent px-3 py-2 transition duration-200 hover:border-slate-800 hover:bg-slate-950/38"
          >
            <span className="block text-sm font-medium text-slate-400 transition group-hover:text-slate-100">
              {link.label}
            </span>
            {showDescriptions && link.description ? (
              <span className="mt-1 block text-xs leading-5 text-slate-600">
                {link.description}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
