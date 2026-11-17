import {
  parsePaddlePortalAction,
  selectPaddlePortalUrl,
  shouldOfferPaymentMethodUpdate,
} from "../lib/paddle-portal";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const portalResponse = {
  data: {
    urls: {
      general: { overview: "https://customer-portal.paddle.com/overview-token" },
      subscriptions: [
        {
          id: "sub_current",
          update_subscription_payment_method: "https://customer-portal.paddle.com/update-current-token",
        },
        {
          id: "sub_other",
          update_subscription_payment_method: "https://customer-portal.paddle.com/update-other-token",
        },
      ],
    },
  },
};

function testAllowsOnlyKnownPortalActions() {
  assert(parsePaddlePortalAction(undefined) === "overview", "Expected omitted actions to preserve the overview flow.");
  assert(parsePaddlePortalAction("overview") === "overview", "Expected overview to be accepted.");
  assert(parsePaddlePortalAction("update_payment_method") === "update_payment_method", "Expected payment method updates to be accepted.");
  assert(parsePaddlePortalAction("cancel") === null, "Expected unapproved portal actions to be rejected.");
  assert(parsePaddlePortalAction({ subscriptionId: "sub_other" }) === null, "Expected object input to be rejected.");
}

function testSelectsOnlyPaddleReturnedPortalUrls() {
  assert(
    selectPaddlePortalUrl(portalResponse, "sub_current", "overview") === "https://customer-portal.paddle.com/overview-token",
    "Expected overview to use Paddle's returned overview URL.",
  );
  assert(
    selectPaddlePortalUrl(portalResponse, "sub_current", "update_payment_method") === "https://customer-portal.paddle.com/update-current-token",
    "Expected the payment action to use the current subscription's Paddle deep link.",
  );
}

function testNeverUsesAnotherSubscriptionsDeepLink() {
  let message = "";
  try {
    selectPaddlePortalUrl(portalResponse, "sub_missing", "update_payment_method");
  } catch (error) {
    message = error instanceof Error ? error.message : "";
  }
  assert(message === "Payment method management is not available for this subscription.", "Expected a missing owned subscription link to fail closed.");
}

function testOffersPaymentUpdateOnlyForPastDueSubscriptions() {
  assert(shouldOfferPaymentMethodUpdate("past_due"), "Expected past-due subscriptions to offer payment recovery.");
  for (const status of ["active", "trialing", "paused", "canceled", "free", undefined]) {
    assert(!shouldOfferPaymentMethodUpdate(status), `Expected ${String(status)} not to offer payment recovery.`);
  }
}

testAllowsOnlyKnownPortalActions();
testSelectsOnlyPaddleReturnedPortalUrls();
testNeverUsesAnotherSubscriptionsDeepLink();
testOffersPaymentUpdateOnlyForPastDueSubscriptions();

console.log("paddle portal tests passed");
