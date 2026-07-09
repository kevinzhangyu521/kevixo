"use client";

import type { GrowthEventType } from "@/lib/growth-events";

const visitorKey = "kevixo.visitorId.v1";

export function getKevixoVisitorId() {
  const existingId = window.localStorage.getItem(visitorKey);

  if (existingId) {
    return existingId;
  }

  const visitorId = crypto.randomUUID();
  window.localStorage.setItem(visitorKey, visitorId);
  return visitorId;
}

export function hasReturningVisitorSignal() {
  return Boolean(window.localStorage.getItem(visitorKey));
}

export async function saveGrowthEvent(eventType: GrowthEventType, reviewId?: string) {
  try {
    await fetch("/api/growth/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        reviewId,
        visitorId: getKevixoVisitorId(),
        sourcePage: window.location.pathname,
      }),
    });
  } catch (error) {
    console.info("Kevixo growth event was not saved", error);
  }
}

export async function saveReviewEmail(email: string, reviewId?: string) {
  const response = await fetch("/api/growth/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      reviewId,
      visitorId: getKevixoVisitorId(),
      sourcePage: window.location.pathname,
    }),
  });
  const payload = (await response.json()) as { ok: boolean; error?: string };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Email could not be saved.");
  }

  return payload;
}
