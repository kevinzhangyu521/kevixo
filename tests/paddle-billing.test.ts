import {
  createCheckoutBinding,
  getPaddleSubscriptionAccess,
  isPaddleEventNewer,
  verifyCheckoutBinding,
  verifyPaddleSignature,
} from "../lib/paddle-billing";
import { createHmac } from "crypto";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testRestrictsCoachAccessToActiveStates() {
  assert(getPaddleSubscriptionAccess("active"), "Expected active subscriptions to have Coach access.");
  assert(getPaddleSubscriptionAccess("trialing"), "Expected trialing subscriptions to have Coach access.");
  assert(!getPaddleSubscriptionAccess("past_due"), "Expected past-due subscriptions to lose Coach access.");
  assert(!getPaddleSubscriptionAccess("paused"), "Expected paused subscriptions to lose Coach access.");
  assert(!getPaddleSubscriptionAccess("canceled"), "Expected canceled subscriptions to lose Coach access.");
}

function testUsesWebhookOccurrenceForOrdering() {
  assert(
    isPaddleEventNewer("2026-09-23T10:00:01.000Z", "2026-09-23T10:00:00.000Z"),
    "Expected a later webhook to replace earlier state.",
  );
  assert(
    !isPaddleEventNewer("2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z"),
    "Expected a duplicate webhook timestamp to preserve existing state.",
  );
}

function testVerifiesCheckoutBinding() {
  const secret = "checkout-binding-test-secret";
  const binding = createCheckoutBinding("user-123", secret, 1760000000);

  assert(
    verifyCheckoutBinding(binding, "user-123", secret),
    "Expected a valid checkout binding to be accepted.",
  );

  assert(
    verifyCheckoutBinding(`${binding}tampered`, "user-123", secret) === false,
    "Expected a tampered checkout binding to be rejected.",
  );
}

function testVerifiesPaddleWebhookSignatures() {
  const secret = "webhook-test-secret";
  const body = '{"event_id":"evt_test"}';
  const timestamp = "1760000000";
  const signature = createHmac("sha256", secret).update(`${timestamp}:${body}`).digest("hex");

  assert(
    verifyPaddleSignature(body, `ts=${timestamp};h1=${signature}`, secret),
    "Expected a valid Paddle webhook signature to be accepted.",
  );
  assert(
    !verifyPaddleSignature(`${body}x`, `ts=${timestamp};h1=${signature}`, secret),
    "Expected a modified Paddle webhook body to be rejected.",
  );
}

testRestrictsCoachAccessToActiveStates();
testUsesWebhookOccurrenceForOrdering();
testVerifiesCheckoutBinding();
testVerifiesPaddleWebhookSignatures();

console.log("paddle billing tests passed");
