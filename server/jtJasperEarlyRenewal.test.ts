import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("JT Jasper early renewal", () => {
  const source = fs.readFileSync("scripts/execute-jt-jasper-early-renewal.mjs", "utf8");

  it("requires a one-time explicit execution flag", () => {
    expect(source).toContain('JT_JASPER_EARLY_RENEWAL_CONFIRM !== "YES"');
  });

  it("modifies only the existing verified subscription", () => {
    expect(source).toContain('stripe.subscriptions.update(SUBSCRIPTION_ID');
    expect(source).toContain('billing_cycle_anchor: "now"');
    expect(source).toContain('proration_behavior: "none"');
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
    expect(source).not.toContain("stripe.invoices.create");
  });

  it("blocks duplicate early-renewal and unpaid-invoice situations before update", () => {
    expect(source).toContain("An early-renewal invoice already exists");
    expect(source).toContain("Existing unpaid subscription invoice");
    expect(source).toContain("recovery_key");
  });
});
