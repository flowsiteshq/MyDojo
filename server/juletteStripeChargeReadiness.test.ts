import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-julette-stripe-charge-readiness.mjs"),
  "utf8",
);

describe("Julette Stripe charge readiness audit", () => {
  it("audits the existing subscription and current-month invoices", () => {
    expect(source).toContain('const SUBSCRIPTION_ID = "sub_1U9XAzL2gHbMVosgpzWg3vS1"');
    expect(source).toContain("stripe.subscriptions.retrieve");
    expect(source).toContain("stripe.invoices.list");
    expect(source).toContain("SEPTEMBER_START");
  });

  it("is read-only and checks a usable saved payment method before collection", () => {
    expect(source).toContain("resolvePaymentMethod");
    expect(source).toContain("paymentMethodAvailable");
    expect(source).not.toMatch(/\.invoices\.pay\s*\(/);
    expect(source).not.toMatch(/\.subscriptions\.create\s*\(/);
    expect(source).not.toMatch(/\.subscriptions\.update\s*\(/);
    expect(source).not.toMatch(/\.paymentIntents\.create\s*\(/);
  });
});
