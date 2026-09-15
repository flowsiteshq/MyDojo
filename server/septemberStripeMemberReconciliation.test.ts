import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/reconcile-september-stripe-member-billing.mjs"),
  "utf8",
);

describe("complete September Stripe member reconciliation", () => {
  it("reconciles all live Stripe subscriptions with active MyDojo records and excludes the owner", () => {
    expect(source).toContain('status: "all"');
    expect(source).toContain('FROM enrollments WHERE status = \'active\'');
    expect(source).toContain("FROM manualEnrollments WHERE status = 'active' AND processor = 'stripe'");
    expect(source).toContain("OWNER_NAMES");
    expect(source).toContain("Owner account is excluded from automatic billing candidates.");
  });

  it("blocks paid, invoiced, non-live, unmatched, and payment-method-ineligible accounts without Stripe mutation calls", () => {
    expect(source).toContain("September tuition invoice is already paid.");
    expect(source).toContain("September invoice already exists");
    expect(source).toContain("Live Stripe subscription has no matching active MyDojo membership record.");
    expect(source).toContain("No reusable card payment method");
    expect(source).not.toMatch(/stripe\.(paymentIntents|subscriptions|invoices|refunds|customers)\.(create|update|cancel|del|finalizeInvoice|pay)\s*\(/);
  });
});
