import {
  getUserEntitlements,
  resolveEntitlements,
  type EntitlementSubscription,
} from "../lib/entitlements";
import { readFileSync } from "fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function subscription(status: string, provider = "paddle"): EntitlementSubscription {
  return { provider, status };
}

function testGrantsCoachForActiveAndTrialingPaddleSubscriptions() {
  for (const status of ["active", "trialing"]) {
    const result = resolveEntitlements({ subscriptions: [subscription(status)] });
    assert(result.plan === "coach", `Expected ${status} Paddle subscription to grant Coach.`);
    assert(result.source === "paddle", `Expected ${status} Coach source to be Paddle.`);
  }
}

function testRejectsInactivePaddleSubscriptions() {
  for (const status of ["past_due", "paused", "canceled"]) {
    const result = resolveEntitlements({ subscriptions: [subscription(status)] });
    assert(result.plan === "free", `Expected ${status} Paddle subscription to remain Free.`);
    assert(result.source === "free", `Expected ${status} source to remain Free.`);
  }
}

function testUsesAnyValidPaddleSubscriptionWhenSeveralExist() {
  const result = resolveEntitlements({
    subscriptions: [
      subscription("canceled"),
      subscription("active"),
      subscription("past_due"),
    ],
  });

  assert(result.plan === "coach", "Expected any valid Paddle subscription to grant Coach.");
  assert(result.source === "paddle", "Expected Paddle to take priority over inactive records.");
}

function testSupportsExplicitExistingCoachProtection() {
  const result = resolveEntitlements({
    subscriptions: [],
    existingCoachProtection: { protected: true, reason: "verified_existing_coach" },
  });

  assert(result.plan === "coach", "Expected an explicitly protected existing Coach to retain access.");
  assert(result.source === "existing_coach_protection", "Expected protected Coach source.");
}

function testDefaultsToFreeWithoutSubscriptionOrProtection() {
  const result = resolveEntitlements({ subscriptions: [] });
  assert(result.plan === "free", "Expected a user without subscription or protection to be Free.");
  assert(result.source === "free", "Expected a user without entitlement evidence to use Free source.");
}

function testIgnoresNonPaddleAndProfilePlanData() {
  const result = resolveEntitlements({
    subscriptions: [subscription("active", "legacy")],
    profilePlan: "coach",
  });

  assert(result.plan === "free", "Expected profile plan and non-Paddle records not to grant Coach.");
}

async function testLoadsSubscriptionsAndExplicitProtection() {
  const result = await getUserEntitlements("user-123", {
    listSubscriptions: async (userId) => {
      assert(userId === "user-123", "Expected subscription lookup to use the authenticated user ID.");
      return [subscription("canceled")];
    },
    getExistingCoachProtection: async (userId) => {
      assert(userId === "user-123", "Expected protection lookup to use the authenticated user ID.");
      return { protected: true, reason: "verified_existing_coach" };
    },
  });

  assert(result.plan === "coach", "Expected verified existing Coach protection to be applied.");
  assert(result.source === "existing_coach_protection", "Expected explicit protection source.");
}

function testExistingCoachCheckDelegatesToUnifiedEntitlements() {
  const source = readFileSync("lib/subscription.ts", "utf8");
  assert(
    /getUserEntitlements\(userId\)/.test(source),
    "Expected the existing Coach check to delegate to unified entitlements.",
  );
}

async function run() {
  testGrantsCoachForActiveAndTrialingPaddleSubscriptions();
  testRejectsInactivePaddleSubscriptions();
  testUsesAnyValidPaddleSubscriptionWhenSeveralExist();
  testSupportsExplicitExistingCoachProtection();
  testDefaultsToFreeWithoutSubscriptionOrProtection();
  testIgnoresNonPaddleAndProfilePlanData();
  testExistingCoachCheckDelegatesToUnifiedEntitlements();
  await testLoadsSubscriptionsAndExplicitProtection();
  console.log("entitlements tests passed");
}

void run();
