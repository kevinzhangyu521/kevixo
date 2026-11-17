import {
  getCoachCheckoutAccess,
  isCoachCheckoutEnabled,
  parseCoachCheckoutTestUserIds,
} from "../lib/coach-checkout";
import { readFileSync } from "fs";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function testCheckoutDefaultsClosed() {
  for (const value of [undefined, "", "false", "TRUE", "1"]) {
    assert(!isCoachCheckoutEnabled(value), `Expected ${String(value)} not to enable checkout.`);
  }
}

function testCheckoutRequiresExplicitTrue() {
  assert(isCoachCheckoutEnabled("true"), "Expected exact true to enable checkout.");
}

const testUserId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "22222222-2222-4222-8222-222222222222";

function testParsesOnlyValidTestUserIds() {
  const ids = parseCoachCheckoutTestUserIds(
    ` ${testUserId},not-a-uuid,${otherUserId.toUpperCase()},${testUserId} `,
  );
  assert(ids.size === 2, "Expected invalid and duplicate allowlist entries to be ignored.");
  assert(ids.has(testUserId), "Expected the configured test user to be included.");
  assert(ids.has(otherUserId), "Expected UUID matching to be case-insensitive.");
}

function testAllowsOnlyWhitelistedUsersWhileGloballyClosed() {
  assert(
    getCoachCheckoutAccess({
      globalEnabled: undefined,
      isCoach: false,
      testUserIds: testUserId,
      userId: testUserId,
    }) === "allowed",
    "Expected the whitelisted user to access checkout.",
  );
  assert(
    getCoachCheckoutAccess({
      globalEnabled: "false",
      isCoach: false,
      testUserIds: testUserId,
      userId: otherUserId,
    }) === "closed",
    "Expected a non-whitelisted user to remain blocked.",
  );
}

function testRejectsAnonymousUsersEvenIfAllowlistExists() {
  assert(
    getCoachCheckoutAccess({
      globalEnabled: "true",
      isCoach: false,
      testUserIds: testUserId,
      userId: undefined,
    }) === "unauthenticated",
    "Expected anonymous users to be rejected before checkout access.",
  );
}

function testGlobalSwitchAllowsAuthenticatedUsers() {
  assert(
    getCoachCheckoutAccess({
      globalEnabled: "true",
      isCoach: false,
      testUserIds: undefined,
      userId: otherUserId,
    }) === "allowed",
    "Expected the global switch to allow authenticated users.",
  );
}

function testExistingCoachCannotPurchaseAgain() {
  assert(
    getCoachCheckoutAccess({
      globalEnabled: "true",
      isCoach: true,
      testUserIds: testUserId,
      userId: testUserId,
    }) === "already_subscribed",
    "Expected an existing Coach user to remain protected from duplicate purchase.",
  );
}

function testPreparedCheckoutRemainsGated() {
  const route = readFileSync("app/api/billing/checkout/route.ts", "utf8");
  const pricing = readFileSync("app/pricing/page.tsx", "utf8");

  assert(/COACH_CHECKOUT_ENABLED/.test(route), "Expected a private server-side checkout gate.");
  assert(/COACH_CHECKOUT_TEST_USER_IDS/.test(route), "Expected a private server-side test allowlist.");
  assert(/export async function GET\(request: Request\)/.test(route), "Expected pricing eligibility to use the authenticated Checkout route.");
  assert(!/request\.json\(|searchParams/.test(route), "Expected the Checkout route not to accept a client-provided user ID.");
  assert(/getPaddleCheckoutConfiguration\(user\)/.test(route), "Expected the original Paddle checkout configuration path.");
  assert(/NEXT_PUBLIC_COACH_CHECKOUT_ENABLED/.test(pricing), "Expected the pricing CTA to use an explicit public gate.");
  assert(/Paddle\.Checkout\.open|paddle\.Checkout\.open/.test(pricing), "Expected the original Paddle Checkout open path.");
  assert(/\$9\.99\/month/.test(pricing), "Expected Coach to remain $9.99/month.");
  assert(!/Monthly Improvement Reports/.test(pricing), "Expected the unimplemented monthly report promise to stay removed.");
}

testCheckoutDefaultsClosed();
testCheckoutRequiresExplicitTrue();
testParsesOnlyValidTestUserIds();
testAllowsOnlyWhitelistedUsersWhileGloballyClosed();
testRejectsAnonymousUsersEvenIfAllowlistExists();
testGlobalSwitchAllowsAuthenticatedUsers();
testExistingCoachCannotPurchaseAgain();
testPreparedCheckoutRemainsGated();
console.log("coach checkout tests passed");
