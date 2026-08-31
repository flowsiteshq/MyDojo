import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditPath = path.resolve(testDirectory, "../scripts/audit-hiramy-cernuda-recurring.mjs");

describe("Hiramy Cernuda recurring audit", () => {
  it("uses only read-only live subscription and invoice retrieval", () => {
    const source = fs.readFileSync(auditPath, "utf8");

    expect(source).toContain('const subscriptionId = "sub_1U9XB6L2gHbMVosgbxyh9DDa"');
    expect(source).toContain("stripe.subscriptions.retrieve(subscriptionId)");
    expect(source).toContain('stripe.invoices.list({ subscription: subscriptionId, limit: 5, expand: ["data.payment_intent"] })');
    expect(source).toContain('stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 10 })');
    expect(source).toContain("stripe.paymentMethods.retrieve(subscriptionPaymentMethodId)");
    expect(source).toContain("parent?.subscription_details?.subscription");
    expect(source).toContain('stripe.invoicePayments.list({ invoice: openInvoice.id, limit: 10, expand: ["data.payment.payment_intent"] })');
    expect(source).toContain("auditOnly: true");
    expect(source).not.toContain("stripe.subscriptions.update");
    expect(source).not.toContain("stripe.invoices.pay");
  });
});
