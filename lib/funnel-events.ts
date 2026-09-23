export const growthEventTypes = [
  "signup_succeeded",
  "email_confirmed",
  "login_succeeded",
  "review_viewed",
  "review_started",
  "analyze_succeeded",
  "analyze_failed",
  "review_persisted",
  "review_persist_failed",
  "review_completed",
  "share_clicked",
  "copy_link_clicked",
  "image_downloaded",
  "daily_challenge_attempted",
  "daily_challenge_completed",
  "checkout_started",
  "checkout_completed",
  "payment_succeeded",
  "subscription_activated",
  "payment_failed",
  "subscription_canceled",
] as const;

export type GrowthEventType = (typeof growthEventTypes)[number];

export function isGrowthEventType(value: string): value is GrowthEventType {
  return growthEventTypes.includes(value as GrowthEventType);
}
