export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

type AnalyticsValue = string | number | boolean | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagCommand = "config" | "event" | "js";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, target: string | Date, params?: AnalyticsParams) => void;
  }
}

function isAnalyticsEnabled() {
  return process.env.NODE_ENV === "production" && Boolean(GA_MEASUREMENT_ID);
}

function ensureGtag() {
  if (typeof window === "undefined") {
    return null;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtag() {
    window.dataLayer?.push(arguments);
  };

  return window.gtag;
}

export function trackPageView(path: string) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ensureGtag()?.("event", "page_view", {
    page_path: path,
  });
}

function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  ensureGtag()?.("event", eventName, params);
}

export function trackAnalyze() {
  trackEvent("analyze_button_clicked");
}

export function trackReviewCompleted(report?: {
  grade?: string;
  confidence?: number;
  difficulty?: number;
}) {
  trackEvent("review_completed", {
    grade: report?.grade,
    confidence: report?.confidence,
    difficulty: report?.difficulty,
  });
}

export function trackFeedback(feedback?: {
  usefulPart?: string;
  hasImprovementText?: boolean;
}) {
  trackEvent("feedback_sent", {
    useful_part: feedback?.usefulPart,
    has_improvement_text: feedback?.hasImprovementText,
  });
}

export function trackDemoSelected(demoId?: string) {
  trackEvent("demo_selected", {
    demo_id: demoId,
  });
}

export function trackQuestion() {
  trackEvent("followup_question_sent");
}
