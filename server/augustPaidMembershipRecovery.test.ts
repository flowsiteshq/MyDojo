import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/recover-august-paid-memberships.mjs"), "utf8");

describe("August paid-membership recovery safeguards", () => {
  it("locks recovery to the 11 user-approved paid enrollments and excludes Naomi Musa", () => {
    expect(source).toContain("const approvedEnrollmentIds = [1170001, 1200004, 1200005, 1200006, 1230001, 1260001, 1290001, 1320001, 1350001, 1410001, 1500001]");
    expect(source).not.toContain("1020001");
    expect(source).toContain("expected ${approvedEnrollmentIds.length} approved enrollments");
  });

  it("defaults to dry run and requires an explicit apply flag for membership recovery", () => {
    expect(source).toContain('const apply = process.argv.includes("--apply")');
    expect(source).toContain("if (apply)");
    expect(source).toContain('status: "already_recovered"');
    expect(source).toContain("existingFamilyMemberOrder");
  });

  it("verifies payment success, existing subscriptions, and future billing before creating no-charge recurring memberships", () => {
    expect(source).toContain('paymentIntent.status !== "succeeded"');
    expect(source).toContain("stripe.subscriptions.list");
    expect(source).toContain("stripe.customers.listPaymentMethods");
    expect(source).toContain("savedCards.data.length === 1");
    expect(source).toContain("invoice_settings.default_payment_method");
    expect(source).toContain("resolveReusableCardPaymentMethod");
    expect(source).toContain('["card", "link"].includes(paymentIntentPaymentMethod?.type)');
    expect(source).toContain('!["card", "link"].includes(paymentMethod.type)');
    expect(source).toContain("billingStart.getTime() <= Date.now()");
    expect(source).toContain("trial_end:");
    expect(source).toContain("idempotencyKey");
    expect(source).toContain("if (!priceId || Number(recovery.familyMemberOrder) > 1)");
    expect(source).toContain("membership_recovery_price");
    expect(source).toContain('status: "needs_payment_method"');
    expect(source).toContain("recoveryBlockedReason: \"no_reusable_saved_card\"");
  });
});
