import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/recover-julette-september-stripe-renewal.mjs"),
  "utf8",
);

describe("Julette September Stripe renewal", () => {
  it("targets only the verified existing $149 subscription", () => {
    expect(source).toContain('const CUSTOMER_ID = "cus_V69C1qAMnPHO6C"');
    expect(source).toContain('const SUBSCRIPTION_ID = "sub_1U9XAzL2gHbMVosgpzWg3vS1"');
    expect(source).toContain("const EXPECTED_AMOUNT_CENTS = 14900");
  });

  it("requires explicit execution approval and blocks duplicate or unpaid billing", () => {
    expect(source).toContain("EXECUTE_APPROVED_JULETTE_SEPTEMBER_RENEWAL");
    expect(source).toContain("RECOVERY_KEY");
    expect(source).toContain("Existing unpaid subscription invoice");
    expect(source).toContain("September tuition is already paid");
    expect(source).toContain("idempotencyKey: RECOVERY_KEY");
  });

  it("charges through the existing subscription and anchors recurring renewal to today’s monthly date", () => {
    expect(source).toContain("stripe.subscriptions.update");
    expect(source).toContain('trial_end: "now"');
    expect(source).toContain('billing_cycle_anchor: "now"');
    expect(source).toContain('payment_behavior: "error_if_incomplete"');
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("stripe.invoices.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });
});
