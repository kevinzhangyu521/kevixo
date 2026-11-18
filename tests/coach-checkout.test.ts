import {
  getCoachCheckoutEventState,
  getCoachCheckoutFailureState,
  getCoachCheckoutSubscriptionUi,
  getCoachCheckoutAccess,
  isCoachCheckoutEnabled,
  openCoachPaddleCheckout,
  parseCoachCheckoutTestUserIds,
} from "../lib/coach-checkout";
import { selectBlockingPaddleSubscriptionStatus } from "../lib/subscription";
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
      subscriptionStatus: null,
      testUserIds: testUserId,
      userId: testUserId,
    }) === "allowed",
    "Expected the whitelisted user to access checkout.",
  );
  assert(
    getCoachCheckoutAccess({
      globalEnabled: "false",
      subscriptionStatus: null,
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
      subscriptionStatus: null,
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
      subscriptionStatus: null,
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
      subscriptionStatus: "active",
      testUserIds: testUserId,
      userId: testUserId,
    }) === "already_subscribed",
    "Expected an existing Coach user to remain protected from duplicate purchase.",
  );
}

function testSelectsBlockingSubscriptionAcrossAllPaddleRows() {
  for (const status of ["active", "trialing", "past_due", "paused"] as const) {
    assert(
      selectBlockingPaddleSubscriptionStatus(["canceled", status]) === status,
      `Expected ${status} to block a second Checkout even when a canceled row also exists.`,
    );
  }
  assert(
    selectBlockingPaddleSubscriptionStatus(["canceled", "expired"]) === null,
    "Expected only terminal subscriptions to allow a new Checkout.",
  );
  assert(
    selectBlockingPaddleSubscriptionStatus(["paused", "past_due", "active"]) === "active",
    "Expected an active subscription to take priority when multiple non-terminal rows exist.",
  );
}

function testCheckoutAccessExplainsEveryBlockingSubscriptionState() {
  const expected = {
    active: "already_subscribed",
    trialing: "already_subscribed",
    past_due: "payment_update_required",
    paused: "subscription_paused",
  } as const;

  for (const [subscriptionStatus, access] of Object.entries(expected)) {
    assert(
      getCoachCheckoutAccess({
        globalEnabled: "true",
        subscriptionStatus,
        testUserIds: undefined,
        userId: testUserId,
      }) === access,
      `Expected ${subscriptionStatus} to return ${access} instead of opening Checkout.`,
    );
  }

  assert(
    getCoachCheckoutAccess({
      globalEnabled: "true",
      subscriptionStatus: null,
      testUserIds: undefined,
      userId: testUserId,
    }) === "allowed",
    "Expected canceled-only users to purchase again when Checkout is globally enabled.",
  );
}

function testBlockingSubscriptionStatesProvideTheCorrectPortalAction() {
  const active = getCoachCheckoutSubscriptionUi("already_subscribed");
  assert(active?.actionLabel === "Manage Subscription", "Expected active Coach users to manage their existing subscription.");
  assert(active?.actionHref === "/account", "Expected subscription management to stay bound to the authenticated account page.");

  const pastDue = getCoachCheckoutSubscriptionUi("payment_update_required");
  assert(pastDue?.actionLabel === "Update Payment Method", "Expected past-due users to receive the payment recovery action.");
  assert(/payment method/i.test(pastDue?.status ?? ""), "Expected past-due users to see payment recovery guidance.");

  const paused = getCoachCheckoutSubscriptionUi("subscription_paused");
  assert(paused?.actionLabel === "Manage Subscription", "Expected paused users to manage or resume their existing subscription.");
  assert(/paused/i.test(paused?.status ?? ""), "Expected paused users to see the existing subscription state.");

  assert(getCoachCheckoutSubscriptionUi("allowed") === null, "Expected users without a blocking subscription to keep the purchase action.");
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

function testPaddleEventsAreRegisteredAtTheSdkLevelAndSupportReopening() {
  type PaddleEvent = {
    name?: string;
    data?: {
      id: string;
      transaction_id: string;
      status: string;
      settings: { display_mode: string; theme: string; variant: string };
    };
  };

  let sdkCallback: ((event: PaddleEvent) => void) | undefined;
  let initializeCalls = 0;
  let updateCalls = 0;
  let openCalls = 0;
  let completionCalls = 0;
  const firstStates: string[] = [];
  const secondStates: string[] = [];
  const paddle = {
    Initialized: false,
    Initialize(options: { token: string; eventCallback: (event: PaddleEvent) => void }) {
      initializeCalls += 1;
      assert(options.token === "live_test_token", "Expected the client token to initialize Paddle.js.");
      sdkCallback = options.eventCallback;
      this.Initialized = true;
    },
    Update(options: { eventCallback: (event: PaddleEvent) => void }) {
      updateCalls += 1;
      sdkCallback = options.eventCallback;
    },
    Checkout: {
      open(options: Record<string, unknown>) {
        openCalls += 1;
        assert(!("eventCallback" in options), "Expected Paddle.Checkout.open not to receive the unsupported eventCallback option.");
      },
    },
  };
  const checkoutOptions = {
    items: [{ priceId: "pri_01test", quantity: 1 }],
    customer: { email: "test@example.com" },
    customData: { user_id: testUserId },
  };

  openCoachPaddleCheckout(paddle, "live_test_token", checkoutOptions, (state) => firstStates.push(state.phase));
  assert(initializeCalls === 1, "Expected the first Checkout to register its callback during Paddle.Initialize.");
  assert(updateCalls === 0, "Expected Paddle.Update not to run before initialization.");
  assert(openCalls === 1, "Expected the first Checkout to open once.");

  sdkCallback?.({
    name: "checkout.loaded",
    data: {
      id: "che_01test",
      transaction_id: "txn_01test",
      status: "ready",
      settings: { display_mode: "wide-overlay", theme: "light", variant: "one-page" },
    },
  });
  sdkCallback?.({
    name: "checkout.closed",
    data: {
      id: "che_01test",
      transaction_id: "txn_01test",
      status: "ready",
      settings: { display_mode: "wide-overlay", theme: "light", variant: "one-page" },
    },
  });
  assert(firstStates.join(",") === "open,idle", "Expected real loaded and closed events to end the first Checkout loading state.");

  openCoachPaddleCheckout(
    paddle,
    "live_test_token",
    checkoutOptions,
    (state) => secondStates.push(state.phase),
    () => { completionCalls += 1; },
  );
  assert(initializeCalls === 1, "Expected Paddle.js to be initialized only once.");
  assert(updateCalls === 1, "Expected reopening to replace the SDK event callback with Paddle.Update.");
  assert(openCalls === 2, "Expected closing Checkout to allow a second open attempt.");
  sdkCallback?.({
    name: "checkout.loaded",
    data: {
      id: "che_02test",
      transaction_id: "txn_02test",
      status: "ready",
      settings: { display_mode: "wide-overlay", theme: "light", variant: "one-page" },
    },
  });
  sdkCallback?.({
    name: "checkout.completed",
    data: {
      id: "che_02test",
      transaction_id: "txn_02test",
      status: "completed",
      settings: { display_mode: "wide-overlay", theme: "light", variant: "one-page" },
    },
  });
  sdkCallback?.({
    name: "checkout.closed",
    data: {
      id: "che_02test",
      transaction_id: "txn_02test",
      status: "draft",
      settings: { display_mode: "wide-overlay", theme: "light", variant: "one-page" },
    },
  });
  assert(secondStates.join(",") === "open,completed,completed", "Expected the second Checkout events to reach the latest React callback without losing completion.");
  assert(completionCalls === 1, "Expected the successful payment callback to run exactly once.");

  const thirdStates: string[] = [];
  openCoachPaddleCheckout(paddle, "live_test_token", checkoutOptions, (state) => thirdStates.push(state.phase));
  sdkCallback?.({ name: "checkout.error" });
  assert(openCalls === 3, "Expected a closed or completed Checkout flow not to block a later SDK open call.");
  assert(updateCalls === 2, "Expected each repeated Checkout attempt to install its own current callback.");
  assert(thirdStates.join(",") === "failed", "Expected a real Paddle checkout.error event to end the opening state.");
}

function testPreparedCheckoutRemainsGated() {
  const route = readFileSync("app/api/billing/checkout/route.ts", "utf8");
  const pricing = readFileSync("app/pricing/page.tsx", "utf8");

  assert(/COACH_CHECKOUT_ENABLED/.test(route), "Expected a private server-side checkout gate.");
  assert(/COACH_CHECKOUT_TEST_USER_IDS/.test(route), "Expected a private server-side test allowlist.");
  assert(/export async function GET\(request: Request\)/.test(route), "Expected pricing eligibility to use the authenticated Checkout route.");
  assert(!/request\.json\(|searchParams/.test(route), "Expected the Checkout route not to accept a client-provided user ID.");
  assert((route.match(/getBlockingPaddleSubscriptionStatus\(user\.id\)/g) ?? []).length === 2, "Expected both Checkout methods to inspect all existing Paddle subscription rows.");
  assert(!/isCoachUser\(user\.id\)/.test(route), "Expected Checkout duplicate protection not to depend on Coach entitlement alone.");
  assert(/getPaddleCheckoutConfiguration\(user\)/.test(route), "Expected the original Paddle checkout configuration path.");
  assert(/NEXT_PUBLIC_COACH_CHECKOUT_ENABLED/.test(pricing), "Expected the pricing CTA to use an explicit public gate.");
  assert(!/if \(globalCheckoutEnabled\) return/.test(pricing), "Expected existing subscriptions to be checked even when public Checkout is globally enabled.");
  assert(/openCoachPaddleCheckout\(/.test(pricing), "Expected pricing to use the tested Paddle Checkout event binding path.");
  assert(/\$9\.99\/month/.test(pricing), "Expected Coach to remain $9.99/month.");
  assert(!/Monthly Improvement Reports/.test(pricing), "Expected the unimplemented monthly report promise to stay removed.");
  assert(!/Coach benefits will be finalized|paid benefits are confirmed|benefits are finalized/i.test(pricing), "Expected stale Coach preparation copy to be removed.");
  assert(/setCheckoutPhase\(nextState\.phase\)/.test(pricing), "Expected Checkout events to update the rendered lifecycle state.");
}

testCheckoutDefaultsClosed();
testCheckoutRequiresExplicitTrue();
testParsesOnlyValidTestUserIds();
testAllowsOnlyWhitelistedUsersWhileGloballyClosed();
testRejectsAnonymousUsersEvenIfAllowlistExists();
testGlobalSwitchAllowsAuthenticatedUsers();
testExistingCoachCannotPurchaseAgain();
testSelectsBlockingSubscriptionAcrossAllPaddleRows();
testCheckoutAccessExplainsEveryBlockingSubscriptionState();
testBlockingSubscriptionStatesProvideTheCorrectPortalAction();
testCheckoutCloseRestoresTheButton();
testCheckoutOpenFailuresRestoreTheButton();
testCheckoutRequestFailuresRestoreTheButton();
testCompletedCheckoutKeepsItsConfirmationWhenClosed();
testPaddleEventsAreRegisteredAtTheSdkLevelAndSupportReopening();
testPreparedCheckoutRemainsGated();
console.log("coach checkout tests passed");
