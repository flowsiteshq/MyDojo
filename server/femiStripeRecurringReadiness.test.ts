import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-femi-stripe-recurring-readiness.mjs"),
  "utf8",
);

describe("Femi Stripe recurring recovery readiness audit", () => {
  it("uses read-only Stripe retrieval methods only", () => {
    expect(source).toContain("stripe.checkout.sessions.list");
    expect(source).toContain("stripe.paymentIntents.retrieve");
    expect(source).toContain("stripe.paymentMethods.list");
    expect(source).toContain("stripe.subscriptions.list");
    expect(source).not.toContain("stripe.paymentIntents.create");
    expect(source).not.toContain("stripe.subscriptions.create");
  });

  it("requires verified off-session reuse evidence and checks for duplicate $272 September billing", () => {
    expect(source).toContain("reusableForOffSession");
    expect(source).toContain("setupFutureUsage");
    expect(source).toContain("amount === 27200");
    expect(source).toContain('startsWith("2026-09")');
  });
});
