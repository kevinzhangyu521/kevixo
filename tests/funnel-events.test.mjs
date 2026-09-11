import { isGrowthEventType } from "../lib/funnel-events.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testRecognizesFunnelEvents() {
  const events = [
    "signup_succeeded",
    "email_confirmed",
    "login_succeeded",
    "review_viewed",
    "review_started",
    "analyze_succeeded",
    "analyze_failed",
    "review_persisted",
    "review_persist_failed",
  ];

  for (const event of events) {
    assert(isGrowthEventType(event), `Expected ${event} to be accepted.`);
  }
}

function testRejectsUnknownEvents() {
  assert(!isGrowthEventType("review_deleted"), "Expected unknown event to be rejected.");
}

testRecognizesFunnelEvents();
testRejectsUnknownEvents();

console.log("funnel event tests passed");
