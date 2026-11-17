import { isCoachCheckoutEnabled } from "../lib/coach-checkout";
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

function testPreparedCheckoutRemainsGated() {
  const route = readFileSync("app/api/billing/checkout/route.ts", "utf8");
  const pricing = readFileSync("app/pricing/page.tsx", "utf8");

  assert(/COACH_CHECKOUT_ENABLED/.test(route), "Expected a private server-side checkout gate.");
  assert(/getPaddleCheckoutConfiguration\(user\)/.test(route), "Expected the original Paddle checkout configuration path.");
  assert(/NEXT_PUBLIC_COACH_CHECKOUT_ENABLED/.test(pricing), "Expected the pricing CTA to use an explicit public gate.");
  assert(/Paddle\.Checkout\.open|paddle\.Checkout\.open/.test(pricing), "Expected the original Paddle Checkout open path.");
  assert(/\$9\.99\/month/.test(pricing), "Expected Coach to remain $9.99/month.");
  assert(!/Monthly Improvement Reports/.test(pricing), "Expected the unimplemented monthly report promise to stay removed.");
}

testCheckoutDefaultsClosed();
testCheckoutRequiresExplicitTrue();
testPreparedCheckoutRemainsGated();
console.log("coach checkout tests passed");
