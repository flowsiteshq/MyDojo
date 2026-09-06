import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("JT Jasper billing readiness audit", () => {
  const source = fs.readFileSync("scripts/audit-jt-jasper-charge-readiness.mjs", "utf8");

  it("uses only read-only Stripe customer, subscription, invoice, charge, and payment-method lookups", () => {
    expect(source).toContain("stripe.customers.retrieve");
    expect(source).toContain("stripe.subscriptions.retrieve");
    expect(source).toContain("stripe.invoices.list");
    expect(source).toContain("stripe.charges.list");
    expect(source).toContain("stripe.paymentMethods.list");
    expect(source).not.toMatch(/stripe\.(paymentIntents|subscriptions|invoices|charges)\.(create|update|confirm|pay|cancel|del)/);
  });

  it("limits the audit to the identified JT Jasper customer and subscription", () => {
    expect(source).toContain('const CUSTOMER_ID = "cus_U2CS0TBeTeE0Lt"');
    expect(source).toContain('const SUBSCRIPTION_ID = "sub_1T483iL2gHbMVosgYAV5yB1s"');
  });
});
