import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("JT Jasper early-renewal invoice collection", () => {
  const source = fs.readFileSync("scripts/collect-jt-jasper-early-renewal.mjs", "utf8");

  it("requires a separate explicit execution flag and uses the live payment account", () => {
    expect(source).toContain('JT_JASPER_EARLY_RENEWAL_COLLECT_CONFIRM !== "YES"');
    expect(source).toContain("process.env.STRIPE_LIVE_SECRET_KEY");
  });

  it("creates a single subscription-bound invoice item and invoice, not a new subscription or payment intent", () => {
    expect(source).toContain("stripe.invoiceItems.create");
    expect(source).toContain("stripe.invoices.create");
    expect(source).toContain("stripe.invoices.finalizeInvoice");
    expect(source).toContain("stripe.invoices.pay");
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });

  it("blocks duplicate recovery invoices and existing unpaid subscription invoices", () => {
    expect(source).toContain("Early-renewal invoice already exists");
    expect(source).toContain("Existing open invoice");
    expect(source).toContain("recovery_key");
  });
});
