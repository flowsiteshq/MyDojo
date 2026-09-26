import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const lindaRetry = fs.readFileSync(path.join(root, "scripts", "retry-linda-september26-unresolved-invoice-once.mjs"), "utf8");
const scheduledCollection = fs.readFileSync(path.join(root, "scripts", "collect-five-september21-scheduled-fluidpay-accounts.mjs"), "utf8");
const verification = fs.readFileSync(path.join(root, "scripts", "verify-september26-authorized-collection-attempts.mjs"), "utf8");

describe("September 26 authorized collection safeguards", () => {
  it("limits the Stripe retry to Linda's exact existing $149 invoice and uses fixed idempotency", () => {
    expect(lindaRetry).toContain('invoiceId: "in_1UFv2RL2gHbMVosgtcPRcq1A"');
    expect(lindaRetry).toContain('paymentIntentId: "pi_3UFvz7L2gHbMVosg0ahsDAUx"');
    expect(lindaRetry).toContain('paymentMethodId: "pm_1U5x3VL2gHbMVosg6U03oGf5"');
    expect(lindaRetry).toContain('IDEMPOTENCY_KEY = "mydojo-linda-september26-unresolved-invoice-retry-v1"');
    expect(lindaRetry).toContain("stripe.invoices.pay(");
    expect(lindaRetry).toContain("openInvoices.length === 1");
    expect(lindaRetry).toContain("Invoice does not match the September 15–October 15 membership coverage.");
    expect(lindaRetry).not.toContain("stripe.invoices.create(");
    expect(lindaRetry).not.toContain("stripe.subscriptions.create(");
    expect(lindaRetry).not.toContain("stripe.paymentIntents.create(");
  });

  it("restricts early legacy collection to fixed scheduled targets and advances dates only after acceptance", () => {
    expect(scheduledCollection).toContain('payer: "Julette McDonald"');
    expect(scheduledCollection).toContain('amountCents: 14_900');
    expect(scheduledCollection).toContain('expectedScheduledDate: "2026-09-30"');
    expect(scheduledCollection).toContain('nextBillDate: "2026-10-30"');
    expect(scheduledCollection).toContain("if (!sale.accepted)");
    expect(scheduledCollection).toContain("const renewalUpdate = await moveNextBillDate");
    expect(scheduledCollection).toContain("existingSeptemberCharges.length > 0");
  });

  it("verifies the exact attempts without creating payment objects", () => {
    expect(verification).toContain('invoiceId: "in_1UFv2RL2gHbMVosgtcPRcq1A"');
    expect(verification).toContain('declinedTransactionId: "darvg1n0i4746vgb1rng"');
    expect(verification).toContain('expectedNextBillDateAfterFailedAttempt: "2026-09-30"');
    expect(verification).toContain("read-only verification");
    expect(verification).not.toContain("stripe.invoices.pay(");
    expect(verification).not.toContain("stripe.invoices.create(");
    expect(verification).not.toContain("api/transaction\", {");
    expect(verification).not.toContain("/status/active?next_bill_date=");
  });
});
