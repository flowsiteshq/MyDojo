import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/audit-september-stripe-billing-candidates.mjs"),
  "utf8",
);

describe("September Stripe billing candidate audit", () => {
  it("is read-only and excludes non-monthly, inactive, payment-method-blocked, and invoiced subscriptions", () => {
    expect(source).toContain('action: "read-only September Stripe recurring billing candidate audit"');
    expect(source).toContain('subscription.status !== "active"');
    expect(source).toContain('item?.price?.recurring?.interval === "month"');
    expect(source).toContain("No reusable card payment method");
    expect(source).toContain("A September invoice is already paid.");
    expect(source).toContain("A September invoice already exists");
  });

  it("does not contain Stripe mutation calls", () => {
    expect(source).not.toMatch(/stripe\.(paymentIntents|subscriptions|invoices|refunds)\.(create|update|cancel|del|finalizeInvoice|pay)\s*\(/);
  });
});
