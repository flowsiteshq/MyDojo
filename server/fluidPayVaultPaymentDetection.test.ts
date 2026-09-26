import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const rosterAudit = fs.readFileSync(path.join(root, "scripts", "audit-fluidpay-september-billing-roster.mjs"), "utf8");
const gapAudit = fs.readFileSync(path.join(root, "scripts", "audit-fluidpay-gap-account-readiness.mjs"), "utf8");
const customerOnlyAudit = fs.readFileSync(path.join(root, "scripts", "audit-fluidpay-customer-only-recovery-readiness.mjs"), "utf8");
const dahliaAudit = fs.readFileSync(path.join(root, "scripts", "audit-dahlia-fluidpay-recurring-lineage.mjs"), "utf8");

describe("FluidPay nested vault payment detection", () => {
  it("counts payment methods returned as payments.cards and customer defaults", () => {
    for (const source of [rosterAudit, gapAudit, customerOnlyAudit]) {
      expect(source).toContain("payments?.cards");
      expect(source).toContain("payments?.ach");
      expect(source).toContain("defaults?.payment_method_id");
      expect(source).toContain("hasStoredPaymentMethod: storedPaymentMethodCount > 0 || defaultPaymentPresent");
    }
  });

  it("blocks a repeat when the current month already contains a declined legacy charge", () => {
    expect(rosterAudit).toContain("blocked_current_month_payment_declined");
    expect(rosterAudit).toContain("A current-month FluidPay charge was already declined");
    expect(gapAudit).toContain("blocked_current_month_payment_declined");
    expect(gapAudit).toContain("subscription.septemberDeclinedChargeCount");
  });

  it("keeps recovery calculations in cents until the report presentation layer", () => {
    expect(customerOnlyAudit).toContain("monthlyAmountCents: record.monthlyAmountCents");
    expect(customerOnlyAudit).toContain("record.monthlyAmountCents > 0");
    expect(customerOnlyAudit).toContain("proposedRecoveryAmountCents: amountSet[0] * positivePackages.length");
  });

  it("keeps Dahlia's lineage review read-only while recognizing nested vault card records", () => {
    expect(dahliaAudit).toContain("const cards = Array.isArray(payments?.cards) ? payments.cards : []");
    expect(dahliaAudit).toContain('"read-only Dahlia Villa FluidPay recurring-billing lineage audit"');
    expect(dahliaAudit).not.toContain('`${API_BASE_URL}/api/transaction", {');
    expect(dahliaAudit).not.toContain("/status/active?next_bill_date=");
  });
});
