import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditPath = path.resolve(testDirectory, "../scripts/audit-uploaded-list-stripe-payment-contexts.mjs");

describe("uploaded billing list Stripe payment-context audit", () => {
  it("uses only current-month charge listing and exposes only payment-classification context", () => {
    const source = fs.readFileSync(auditPath, "utf8");

    expect(source).toContain("stripe.charges.list({");
    expect(source).toContain("hasInvoice: Boolean(charge.invoice)");
    expect(source).toContain("allowedMetadata(charge.metadata)");
    expect(source).toContain("auditOnly: true");
  });

  it("does not create, change, retry, or schedule a payment", () => {
    const source = fs.readFileSync(auditPath, "utf8");

    expect(source).not.toContain("stripe.charges.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
    expect(source).not.toContain("stripe.invoices.pay");
    expect(source).not.toContain("stripe.subscriptions.update");
  });
});
