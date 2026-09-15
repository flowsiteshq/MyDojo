import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/audit-late-august-stripe-new-members.mjs"),
  "utf8",
);

describe("late-August Stripe new-member audit", () => {
  it("includes live membership checkout sessions and reconciles each subscription and September invoice read-only", () => {
    expect(source).toContain("stripe.checkout.sessions.list");
    expect(source).toContain("stripe.paymentIntents.retrieve");
    expect(source).toContain("stripe.customers.retrieve");
    expect(source).toContain("stripe.checkout.sessions.listLineItems");
    expect(source).toContain("setupFutureUsage");
    expect(source).toContain("stripe.subscriptions.list");
    expect(source).toContain("stripe.invoices.list");
    expect(source).toContain("membership_enrollment_checkout");
  });

  it("contains no payment or recurring-billing mutation", () => {
    expect(source).not.toMatch(/stripe\.(paymentIntents|subscriptions|invoices|refunds|customers|checkout\.sessions)\.(create|update|cancel|del|pay|finalizeInvoice)\s*\(/);
    expect(source).not.toContain("INSERT INTO");
    expect(source).not.toContain("UPDATE ");
  });
});
