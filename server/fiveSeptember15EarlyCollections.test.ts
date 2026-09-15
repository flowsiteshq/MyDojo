import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/collect-five-september-15-subscriptions-early.mjs"),
  "utf8",
);

describe("five September 15 early collections", () => {
  it("limits the operation to five approved existing subscriptions and explicitly excludes Cintia", () => {
    expect(source).toContain("const TARGETS = [");
    expect(source).toContain('student: "Srijit Mukherjee"');
    expect(source).toContain('student: "Karin Gonzalez Pérez"');
    expect(source).toContain('student: "Kevin Jimenez"');
    expect(source).toContain('excluded: ["Cintia Garza"]');
  });

  it("checks trial state, amount, payment method, paid September invoices, and open invoices before collection", () => {
    expect(source).toContain('subscription.status !== "trialing"');
    expect(source).toContain("subscription.items.data[0].price.unit_amount !== target.expectedAmountCents");
    expect(source).toContain("!subscription.default_payment_method");
    expect(source).toContain("already has a paid September subscription invoice");
    expect(source).toContain("already has an open subscription invoice");
  });

  it("creates one recovered invoice, pays it once, then sets the existing subscription to October 15", () => {
    expect(source).toContain('COLLECT_FIVE_SEPTEMBER_15_SUBSCRIPTIONS_APPROVED');
    expect(source).toContain('stripe.invoices.pay');
    expect(source).toContain("amount: target.expectedAmountCents");
    expect(source).toContain('currency: "usd"');
    expect(source).toContain('trial_end: NEXT_BILLING_AT');
    expect(source).toContain('new Date(NEXT_BILLING_AT * 1000).toISOString()');
    expect(source).toContain('recovery_key: key');
    expect(source).not.toContain('pending_invoice_items_behavior: "exclude"');
  });

  it("uses only a verified empty prior draft with fresh retry keys", () => {
    expect(source).toContain('prior recovery invoice is not an empty unpaid draft and cannot be voided');
    expect(source).toContain('prior recovery draft has line items and cannot be safely rebuilt');
    expect(source).toContain('has no verified existing empty recovery draft; no replacement invoice was created');
    expect(source).toContain('existing-draft-v3');
    expect(source).not.toContain('stripe.invoices.del');
  });

  it("does not create subscriptions, refunds, payment intents, or cancellation actions", () => {
    expect(source).not.toMatch(/stripe\.subscriptions\.create\s*\(/);
    expect(source).not.toMatch(/stripe\.(refunds|paymentIntents)\.(create|update)\s*\(/);
    expect(source).not.toMatch(/stripe\.subscriptions\.(cancel|del)\s*\(/);
  });
});
