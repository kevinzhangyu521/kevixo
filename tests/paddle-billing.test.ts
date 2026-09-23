import {
  createCheckoutBinding,
  getPaddleFunnelEventType,
  getPaddleSubscriptionAccess,
  getVerifiedPaddleSubscription,
  isPaddleEventNewer,
  verifyCheckoutBinding,
  verifyPaddleSignature,
} from "../lib/paddle-billing";
import { createHmac } from "crypto";
import { selectLatestPaddleSubscriptions } from "../lib/admin-users";
import { readFileSync } from "fs";

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
  assert(
    !verifyPaddleSignature(body, `ts=${timestamp};h1=${signature}tampered`, secret),
    "Expected a malformed Paddle webhook signature to be rejected.",
  );
  assert(!verifyPaddleSignature(body, null, secret), "Expected a missing Paddle webhook signature to be rejected.");
}

function testMapsTrustedPaddleLifecycleEvents() {
  assert(getPaddleFunnelEventType("transaction.completed") === "payment_succeeded", "Expected completed transactions to be trusted payment events.");
  assert(getPaddleFunnelEventType("transaction.payment_failed") === "payment_failed", "Expected failed payments to be tracked.");
  assert(getPaddleFunnelEventType("subscription.canceled") === "subscription_canceled", "Expected cancellations to be tracked.");
  assert(getPaddleFunnelEventType("adjustment.updated") === undefined, "Expected adjustments not to grant Coach access.");
  assert(getPaddleFunnelEventType("unknown.event") === undefined, "Expected unknown events to be ignored.");
}

function testSupportsSubscriptionLifecyclePayloads() {
  const secret = "checkout-binding-test-secret";
  const userId = "user-123";
  const binding = createCheckoutBinding(userId, secret, 1760000000);
  const states = [
    ["subscription.created", "active"],
    ["subscription.activated", "active"],
    ["subscription.updated", "active"],
    ["subscription.canceled", "canceled"],
    ["subscription.past_due", "past_due"],
    ["subscription.paused", "paused"],
    ["subscription.resumed", "active"],
  ];

  for (const [eventType, status] of states) {
    const subscription = getVerifiedPaddleSubscription(
      {
        event_id: `evt_${eventType}`,
        event_type: eventType,
        occurred_at: "2026-09-24T00:00:00.000Z",
        data: {
          id: "sub_123",
          customer_id: "ctm_123",
          status,
          custom_data: { kevixo_user_id: userId, kevixo_checkout_binding: binding },
          items: [{ price: { id: "pri_coach" } }],
        },
      },
      secret,
      "pri_coach",
    );

    assert(subscription?.status === status, `Expected ${eventType} to retain its Paddle status.`);
  }
}

function testKeepsTheLatestPaddleSubscriptionForAdmin() {
  const subscriptions = selectLatestPaddleSubscriptions([
    { user_id: "user-123", status: "active", paddle_customer_id: "ctm_new", paddle_subscription_id: "sub_new", next_billed_at: null },
    { user_id: "user-123", status: "canceled", paddle_customer_id: "ctm_old", paddle_subscription_id: "sub_old", next_billed_at: null },
  ]);

  assert(subscriptions.get("user-123")?.paddle_subscription_id === "sub_new", "Expected Admin to retain the newest subscription row.");
}

function testDatabaseIdempotencySchema() {
  const migration = readFileSync("supabase/migrations/009_paddle_billing.sql", "utf8");
  assert(/event_id text primary key/i.test(migration), "Expected Paddle webhook event IDs to have a database primary key.");
}

function testValidatesSubscriptionIdentityWithoutEmailFallback() {
  const secret = "checkout-binding-test-secret";
  const userId = "user-123";
  const event = {
    event_id: "evt_123",
    event_type: "subscription.activated",
    occurred_at: "2026-09-24T00:00:00.000Z",
    data: {
      id: "sub_123",
      customer_id: "ctm_123",
      status: "active",
      custom_data: {
        kevixo_user_id: userId,
        kevixo_checkout_binding: createCheckoutBinding(userId, secret, 1760000000),
      },
      items: [{ price: { id: "pri_coach" } }],
    },
  };

  assert(
    getVerifiedPaddleSubscription(event, secret, "pri_coach")?.userId === userId,
    "Expected valid custom data to bind the current user.",
  );
  assert(
    getVerifiedPaddleSubscription(event, secret, "pri_other") === null,
    "Expected an unconfigured Paddle price to be rejected.",
  );
  assert(
    getVerifiedPaddleSubscription(
      {
        ...event,
        data: { ...event.data, custom_data: { kevixo_user_id: "other-user" } },
      },
      secret,
      "pri_coach",
    ) === null,
    "Expected missing or mismatched binding to reject the subscription without email fallback.",
  );
  assert(
    getVerifiedPaddleSubscription(
      { ...event, data: { ...event.data, custom_data: { email: "player@example.com" } } },
      secret,
      "pri_coach",
    ) === null,
    "Expected missing Kevixo user ID to reject the subscription without email fallback.",
  );
}

function testServerSideCheckoutAndPortalBoundaries() {
  const checkout = readFileSync("app/api/billing/checkout/route.ts", "utf8");
  const portal = readFileSync("app/api/billing/portal/route.ts", "utf8");
  const pricing = readFileSync("app/pricing/page.tsx", "utf8");
  const webhook = readFileSync("app/api/paddle/webhook/route.ts", "utf8");
  const paddleAdmin = readFileSync("lib/paddle-admin.ts", "utf8");

  assert(/getUserFromRequest\(request\)/.test(checkout), "Expected checkout configuration to require authentication.");
  assert(/createPaddlePortalUrl\(user\.id\)/.test(portal), "Expected portal access to use only the authenticated user ID.");
  assert(/Payment received\. Your Coach status will update after secure confirmation\./.test(pricing), "Expected browser checkout completion not to grant Coach.");
  assert(/const body = await request\.text\(\)/.test(webhook), "Expected webhook signature verification to use the raw request body.");
  assert(/request\.headers\.get\("paddle-signature"\)/.test(webhook), "Expected webhook to require Paddle's signature header.");
  assert(/verifyCheckoutBinding\(customBinding, customUserId/.test(paddleAdmin), "Expected lifecycle attribution to verify custom data bindings.");
}

testRestrictsCoachAccessToActiveStates();
testUsesWebhookOccurrenceForOrdering();
testVerifiesCheckoutBinding();
testVerifiesPaddleWebhookSignatures();
testMapsTrustedPaddleLifecycleEvents();
testSupportsSubscriptionLifecyclePayloads();
testValidatesSubscriptionIdentityWithoutEmailFallback();
testKeepsTheLatestPaddleSubscriptionForAdmin();
testDatabaseIdempotencySchema();
testServerSideCheckoutAndPortalBoundaries();

console.log("paddle billing tests passed");
