import {
  getCoachCheckoutEventState,
  getCoachCheckoutFailureState,
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

function testCheckoutCloseRestoresTheButton() {
  const state = getCoachCheckoutEventState("checkout.closed", false);
  assert(state?.isLoading === false, "Expected closing Checkout to restore the purchase button.");
  assert(state?.status === "Checkout closed. Your Free plan is unchanged.", "Expected closing Checkout to clear the preparing message.");
}

function testCheckoutOpenFailuresRestoreTheButton() {
  for (const eventName of ["checkout.error", "checkout.payment.error"]) {
    const state = getCoachCheckoutEventState(eventName, false);
    assert(state?.isLoading === false, `Expected ${eventName} to restore the purchase button.`);
    assert(state?.status === "Checkout could not be opened. Please try again.", `Expected ${eventName} to show a retryable error.`);
  }
}

function testCheckoutRequestFailuresRestoreTheButton() {
  const state = getCoachCheckoutFailureState(new Error("Checkout request failed."));
  assert(state.isLoading === false, "Expected a failed Checkout request to restore the purchase button.");
  assert(state.status === "Checkout request failed.", "Expected a failed Checkout request to replace the preparing message.");
}

function testCompletedCheckoutKeepsItsConfirmationWhenClosed() {
  const completed = getCoachCheckoutEventState("checkout.completed", false);
  assert(completed?.paymentCompleted === true, "Expected completion to be remembered.");
  assert(completed?.isLoading === false, "Expected completion to restore the button state.");
  const closed = getCoachCheckoutEventState("checkout.closed", completed?.paymentCompleted ?? false);
  assert(closed?.status === "Payment received. Your Coach status will update after secure confirmation.", "Expected close after payment not to overwrite the confirmation.");
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
  assert(!/Coach benefits will be finalized|paid benefits are confirmed|benefits are finalized/i.test(pricing), "Expected stale Coach preparation copy to be removed.");
  assert(/setIsLoading\(false\)/.test(pricing), "Expected Checkout terminal paths to restore the button.");
}

testCheckoutDefaultsClosed();
testCheckoutRequiresExplicitTrue();
testParsesOnlyValidTestUserIds();
testAllowsOnlyWhitelistedUsersWhileGloballyClosed();
testRejectsAnonymousUsersEvenIfAllowlistExists();
testGlobalSwitchAllowsAuthenticatedUsers();
testExistingCoachCannotPurchaseAgain();
testCheckoutCloseRestoresTheButton();
testCheckoutOpenFailuresRestoreTheButton();
testCheckoutRequestFailuresRestoreTheButton();
testCompletedCheckoutKeepsItsConfirmationWhenClosed();
testPreparedCheckoutRemainsGated();
console.log("coach checkout tests passed");
