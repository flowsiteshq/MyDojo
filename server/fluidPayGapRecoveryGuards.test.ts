import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const gapAudit = fs.readFileSync(path.join(projectRoot, "scripts/audit-fluidpay-gap-account-readiness.mjs"), "utf8");
const customerOnlyAudit = fs.readFileSync(path.join(projectRoot, "scripts/audit-fluidpay-customer-only-recovery-readiness.mjs"), "utf8");
const brendaCollection = fs.readFileSync(path.join(projectRoot, "scripts/collect-brenda-galvez-september-current-tuition-once.mjs"), "utf8");
const brendaVerification = fs.readFileSync(path.join(projectRoot, "scripts/verify-brenda-galvez-september-current-tuition.mjs"), "utf8");
const scheduledCollection = fs.readFileSync(path.join(projectRoot, "scripts/collect-five-september21-scheduled-fluidpay-accounts.mjs"), "utf8");
const scheduledVerification = fs.readFileSync(path.join(projectRoot, "scripts/verify-five-september21-scheduled-fluidpay-collections.mjs"), "utf8");


describe("FluidPay gap recovery safeguards", () => {
  it("requires a local tuition amount that exactly matches the provider subscription before a past-due account can be listed as chargeable", () => {
    expect(gapAudit).toContain("blocked_local_amount_mismatch");
    expect(gapAudit).toContain("totalActiveMonthlyAmountCents !== subscription.amountCents");
    expect(gapAudit).toContain("blocked_local_price_missing");
    expect(gapAudit).toContain("Brenda Galvez — exclude from FluidPay collection list by staff direction");
  });

  it("keeps customer-only records blocked unless a payment method, exact monthly amount, and separate recurring decision are available", () => {
    expect(customerOnlyAudit).toContain("blocked_missing_payment_method");
    expect(customerOnlyAudit).toContain("customer_only_recovery_requires_billing_day_confirmation");
    expect(customerOnlyAudit).toContain("Gianna Gozzo");
    expect(customerOnlyAudit).toContain("María Gozzo");
  });

  it("limits the Brenda collection workflow to one exact current-month charge and does not modify subscription billing", () => {
    expect(brendaCollection).toContain('payer: "Brenda Galvez"');
    expect(brendaCollection).toContain('student: "Esvin Lopez"');
    expect(brendaCollection).toContain("amountCents: 34_800");
    expect(brendaCollection).toContain('idempotency_time: 3_600');
    expect(brendaCollection).toContain("existingSeptemberTransactions.length > 0");
    expect(brendaCollection).toContain("totalActiveMonthlyAmountCents !== TARGET.amountCents");
    expect(brendaCollection).toContain("COLLECTION_HOLD");
    expect(brendaCollection).toContain("no further charge or retry is permitted");
    expect(brendaCollection).not.toContain("/status/active");
    expect(brendaCollection).not.toContain("next_bill_date=");
  });

  it("verifies collection outcomes against the provider ledger before reporting payment success", () => {
    expect(brendaVerification).toContain("acceptedCurrentMonthCharges");
    expect(brendaVerification).toContain("No accepted September $348 FluidPay charge exists");
    expect(brendaVerification).toContain("read-only Brenda September current-month collection verification");
  });

  it("limits approved early collection to the five scheduled accounts and moves billing dates only after an accepted payment", () => {
    expect(scheduledCollection).toContain("const TARGETS = [");
    expect(scheduledCollection).toContain("Dahlia Villa");
    expect(scheduledCollection).toContain("FREDY A. CAMPOS");
    expect(scheduledCollection).toContain("Brittany Massey");
    expect(scheduledCollection).toContain("Lynn Nguyen");
    expect(scheduledCollection).toContain("Julette McDonald");
    expect(scheduledCollection).toContain("EXCLUDED_CUSTOMER_IDS");
    expect(scheduledCollection).toContain("existingSeptemberCharges.length > 0");
    expect(scheduledCollection).toContain("sale.accepted");
    expect(scheduledCollection).toContain("moveNextBillDate");
    expect(scheduledCollection).toContain("payment_accepted_and_next_bill_date_moved");
  });

  it("verifies the five scheduled collection attempts against fixed provider intents and billing dates", () => {
    expect(scheduledVerification).toContain("idempotencyKey");
    expect(scheduledVerification).toContain("acceptedAttemptTransactions.length === 1");
    expect(scheduledVerification).toContain("acceptedAttemptTransactions.length === 0");
    expect(scheduledVerification).toContain("expectedNextBillDate");
    expect(scheduledVerification).toContain("Provider-accepted transactions remain pending settlement");
  });
});
