import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const retryPath = path.resolve(testDirectory, "../scripts/retry-hiramy-cernuda-existing-invoice.mjs");

describe("Hiramy Cernuda existing-invoice retry", () => {
  it("requires exact approval and limits the retry to the single known open invoice", () => {
    const source = fs.readFileSync(retryPath, "utf8");

    expect(source).toContain('HIRAMY_CERNUDA_INVOICE_RETRY_APPROVED !== "approve-invoice-retry-14900"');
    expect(source).toContain('const invoiceId = "in_1UALhhL2gHbMVosgvBXdOTxr"');
    expect(source).toContain('const subscriptionId = "sub_1U9XB6L2gHbMVosgbxyh9DDa"');
    expect(source).toContain("invoiceSubscriptionId(invoice) !== subscriptionId");
    expect(source).toContain("invoice.parent?.subscription_details?.subscription");
    expect(source).toContain("invoice.amount_due !== approvedAmountCents");
  });

  it("attaches the existing assigned payment method and retries only the open invoice", () => {
    const source = fs.readFileSync(retryPath, "utf8");

    expect(source).toContain("stripe.invoices.update(invoiceId");
    expect(source).toContain("default_payment_method: assignedPaymentMethodId");
    expect(source).toContain("stripe.invoices.pay(");
    expect(source).toContain("idempotencyKey:");
    expect(source).toContain("not_retried_already_paid");
    expect(source).not.toContain("stripe.invoices.create");
    expect(source).not.toContain("stripe.subscriptions.create");
  });
});
