"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics";

export function GoogleAnalytics() {
  const isEnabled = process.env.NODE_ENV === "production" && Boolean(GA_MEASUREMENT_ID);
  const pathname = usePathname();

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    trackPageView(`${window.location.pathname}${window.location.search}`);
  }, [isEnabled, pathname]);

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
