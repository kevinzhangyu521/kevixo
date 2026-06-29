export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const CLARITY_PROJECT_ID = "xeh07r3ewa";

type AnalyticsValue = string | number | boolean | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagCommand = "config" | "event" | "js";
type GtagArguments = [GtagCommand, string | Date, AnalyticsParams?];
type ClarityArguments = [string, ...AnalyticsValue[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, target: string | Date, params?: AnalyticsParams) => void;
    clarity?: {
      (...args: ClarityArguments): void;
      q?: ClarityArguments[];
    };
  }
}

function isAnalyticsEnabled() {
  return process.env.NODE_ENV === "production" && Boolean(GA_MEASUREMENT_ID);
}

export function isProductionAnalyticsEnabled() {
  return process.env.NODE_ENV === "production";
}

function ensureGtag() {
  if (typeof window === "undefined") {
    return null;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtag(...args: GtagArguments) {
    window.dataLayer?.push(args);
  };

  return window.gtag;
}

export function initializeGoogleAnalytics() {
  if (!isAnalyticsEnabled()) {
    return;
  }

  const gtag = ensureGtag();

  gtag?.("js", new Date());
  gtag?.("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
  });
}

export function initializeClarity() {
  if (!isProductionAnalyticsEnabled() || typeof window === "undefined" || window.clarity) {
    return;
  }

  window.clarity = function clarity(...args: ClarityArguments) {
    window.clarity!.q = window.clarity!.q ?? [];
    window.clarity!.q!.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  document.head.appendChild(script);
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
