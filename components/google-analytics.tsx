"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  CLARITY_PROJECT_ID,
  GA_MEASUREMENT_ID,
  initializeClarity,
  initializeGoogleAnalytics,
  isProductionAnalyticsEnabled,
  trackPageView,
} from "@/lib/analytics";

export function AnalyticsScripts() {
  const isEnabled = isProductionAnalyticsEnabled();
  const hasGoogleAnalytics = isEnabled && Boolean(GA_MEASUREMENT_ID);
  const hasClarity = isEnabled && Boolean(CLARITY_PROJECT_ID);
  const pathname = usePathname();

  useEffect(() => {
    if (!hasGoogleAnalytics) {
      return;
    }

    initializeGoogleAnalytics();
  }, [hasGoogleAnalytics]);

  useEffect(() => {
    if (!hasClarity) {
      return;
    }

    initializeClarity();
  }, [hasClarity]);

  useEffect(() => {
    if (!hasGoogleAnalytics) {
      return;
    }

    trackPageView(`${window.location.pathname}${window.location.search}`);
  }, [hasGoogleAnalytics, pathname]);

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {hasGoogleAnalytics ? (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
