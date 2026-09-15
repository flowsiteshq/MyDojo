import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/audit-stripe-dashboard-september-14-ledger.mjs", import.meta.url), "utf8");

describe("Stripe Dashboard September 14 payment ledger", () => {
  it("is a read-only Eastern-time payment-intent reconciliation", () => {
    expect(source).toContain('action: "read-only Stripe Dashboard payment-intent reconciliation"');
    expect(source).toContain('timeZone: "America/New_York"');
    expect(source).toContain("stripe.paymentIntents.list");
    expect(source).toContain("stripe.invoices.retrieve");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".pay(");
  });
});
