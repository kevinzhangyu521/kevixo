"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackAnalyze } from "@/lib/analytics";

type AnalyticsLinkProps = LinkProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    event: "analyze_button_clicked";
  };

export function AnalyticsLink({ children, event, onClick, ...props }: AnalyticsLinkProps) {
  return (
    <Link
      {...props}
      onClick={(clickEvent) => {
        if (event === "analyze_button_clicked") {
          trackAnalyze();
        }

        onClick?.(clickEvent);
      }}
    >
      {children}
    </Link>
  );
}
