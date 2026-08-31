import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/audit-pham-payment-readiness.mjs"), "utf8");

describe("Pham payment readiness audit", () => {
  it("checks customers and saved card methods without creating a charge or subscription", () => {
    expect(source).toContain("stripe.customers.search");
    expect(source).toContain("stripe.paymentMethods.list");
    expect(source).toContain("stripe.paymentIntents.list");
    expect(source).not.toContain("stripe.paymentIntents.create");
    expect(source).not.toContain("stripe.subscriptions.create");
  });
});
