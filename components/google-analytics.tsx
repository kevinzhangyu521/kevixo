"use client";

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

  return null;
}

export function GoogleAnalyticsBootstrap() {
  const hasGoogleAnalytics = isProductionAnalyticsEnabled() && Boolean(GA_MEASUREMENT_ID);

  useEffect(() => {
    if (!hasGoogleAnalytics || typeof document === "undefined") {
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? function gtag(...args) {
      window.dataLayer?.push(args);
    };

    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }

    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);
  }, [hasGoogleAnalytics]);

  return null;
}
