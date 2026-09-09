import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/create-hannah-one-day-weekly-recurring-enrollment.ts"),
  "utf8",
);
const auditSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-hannah-one-day-weekly-recurring-enrollment.ts"),
  "utf8",
);

describe("scheduled student one-day weekly recurring enrollment link", () => {
  it("uses the approved $99 down payment, $74 first month, and $74 monthly tuition", () => {
    expect(source).toContain("const DOWN_PAYMENT_CENTS = 9_900");
    expect(source).toContain("const MONTHLY_TUITION_CENTS = 7_400");
    expect(source).toContain("const DUE_TODAY_CENTS = DOWN_PAYMENT_CENTS + MONTHLY_TUITION_CENTS");
    expect(source).toContain("session.amount_total !== DUE_TODAY_CENTS");
  });

  it("uses a hosted Stripe subscription checkout with one-time and monthly line items", () => {
    expect(source).toContain('mode: "subscription"');
    expect(source).toContain('unit_amount: DOWN_PAYMENT_CENTS');
    expect(source).toContain('unit_amount: MONTHLY_TUITION_CENTS');
    expect(source).toContain('recurring: { interval: "month" }');
    expect(source).toContain("subscription_data");
  });

  it("requires approval, blocks duplicate checkout or subscription setup, and audits a single SMS", () => {
    expect(source).toContain("EXECUTE_APPROVED_HANNAH_ONE_DAY_RECURRING_LINK");
    expect(source).toContain("findExistingSession");
    expect(source).toContain("stripe.customers.search");
    expect(source).toContain("assertNoActiveMatchingSubscription");
    expect(source).toContain("messageAlreadyRecorded");
    expect(source).toContain("INSERT INTO smsMessages");
    expect(source).toContain("optedOut");
  });

  it("does not create a direct charge or a standalone subscription before checkout", () => {
    expect(source).not.toContain("paymentIntents.create");
    expect(source).not.toContain("subscriptions.create");
    expect(source).toContain("subscriptionCreated: false");
  });

  it("independently audits the open checkout line items and verifies no premature payment or subscription", () => {
    expect(auditSource).toContain("stripe.checkout.sessions.listLineItems");
    expect(auditSource).toContain("DUE_TODAY_CENTS");
    expect(auditSource).toContain("DOWN_PAYMENT_CENTS");
    expect(auditSource).toContain("MONTHLY_TUITION_CENTS");
    expect(auditSource).toContain("paymentIntentPresent");
    expect(auditSource).toContain("subscriptionPresent");
    expect(auditSource).toContain("matchingMonthlySubscriptionCount");
  });
});
