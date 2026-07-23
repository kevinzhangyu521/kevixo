import Link from "next/link";

export function AdminNav({ active }: { active: "dashboard" | "feedback" | "users" }) {
  const items = [
    { id: "dashboard", label: "Dashboard", href: "/admin" },
    { id: "feedback", label: "Feedback", href: "/admin/feedback" },
    { id: "users", label: "Users", href: "/admin/users" },
  ] as const;

  return (
    <nav
      aria-label="Admin navigation"
      className="mt-8 inline-flex rounded-2xl border border-slate-800 bg-slate-950/48 p-1"
    >
      {items.map((item) => {
        const isActive = active === item.id;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-400 hover:bg-slate-900/70 hover:text-slate-100",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
