import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const preflight = fs.readFileSync(path.join(root, "scripts", "preflight-september27-authorized-past-due-collection.mjs"), "utf8");
const lindaRetry = fs.readFileSync(path.join(root, "scripts", "retry-linda-september27-authorized-past-due-invoice-once.mjs"), "utf8");
const verification = fs.readFileSync(path.join(root, "scripts", "verify-september27-authorized-past-due-collection.mjs"), "utf8");

describe("September 27 past-due Stripe collection safeguards", () => {
  it("keeps Coral and Hiramy blocked until a current payment method is updated", () => {
    expect(preflight).toContain('payer: "Coral Perez"');
    expect(preflight).toContain('payer: "Hiramy Cernuda"');
    expect(preflight).toContain('retryPolicy: "blocked_until_updated_payment_method"');
    expect(preflight).toContain("Do not retry Karin's open $149 invoice without an updated payment method.");
    expect(preflight).toContain("Do not retry Hiramy's open $149 invoice without an updated payment method.");
  });

  it("binds the only eligible retry to Linda's exact invoice and default card", () => {
    expect(lindaRetry).toContain('invoiceId: "in_1UFv2RL2gHbMVosgtcPRcq1A"');
    expect(lindaRetry).toContain('paymentIntentId: "pi_3UFvz7L2gHbMVosg0ahsDAUx"');
    expect(lindaRetry).toContain('paymentMethodId: "pm_1U5x3VL2gHbMVosg6U03oGf5"');
    expect(lindaRetry).toContain('paymentMethod.card?.last4 === "8117"');
    expect(lindaRetry).toContain('openInvoices.length === 1 && openInvoices[0] === TARGET.invoiceId');
  });

  it("requires an explicit execution flag and fixed idempotency key", () => {
    expect(lindaRetry).toContain('const EXECUTION_FLAG = "EXECUTE_LINDA_SEPTEMBER27_AUTHORIZED_PAST_DUE_RETRY"');
    expect(lindaRetry).toContain('const IDEMPOTENCY_KEY = "mydojo-linda-september27-authorized-past-due-retry-v1"');
    expect(lindaRetry).toContain("process.env[EXECUTION_FLAG] !== REQUIRED_FLAG_VALUE");
    expect(lindaRetry).toContain("{ idempotencyKey: IDEMPOTENCY_KEY }");
  });

  it("records a provider decline before the read-only outcome verification", () => {
    expect(lindaRetry).toContain("let providerError = null;");
    expect(lindaRetry).toContain("providerError = error instanceof Error ? error.message : String(error);");
    expect(lindaRetry).toContain("providerError,");
    expect(lindaRetry).toContain('stripe.invoices.retrieve(TARGET.invoiceId, { expand: ["payments.data.payment.payment_intent"] })');
  });

  it("does not create a replacement billing object", () => {
    for (const forbidden of [
      ".invoices.create(",
      ".paymentIntents.create(",
      ".subscriptions.create(",
      ".subscriptions.update(",
      ".refunds.create(",
    ]) {
      expect(lindaRetry).not.toContain(forbidden);
    }
  });

  it("verifies the original invoices without running another payment attempt", () => {
    expect(verification).toContain('action: "read-only verification of September 27, 2026 authorized past-due Stripe collection attempt"');
    expect(verification).toContain('invoice.status === "paid" && invoice.amount_paid === target.amountCents && invoice.amount_remaining === 0');
    expect(verification).not.toContain(".invoices.pay(");
    expect(verification).not.toContain(".paymentIntents.create(");
  });
});
