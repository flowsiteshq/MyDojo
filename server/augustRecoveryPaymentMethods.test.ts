import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/inspect-august-recovery-payment-methods.mjs"), "utf8");

describe("August recovery payment-method diagnostic", () => {
  it("inspects only the six recovery-blocked enrollments without mutations", () => {
    expect(source).toContain("const enrollmentIds = [1200004, 1200005, 1200006, 1350001, 1410001, 1500001]");
    expect(source).toContain("stripe.customers.listPaymentMethods");
    expect(source).toContain("defaultSourcePresent");
    expect(source).not.toContain("stripe.customers.listSources");
    expect(source).toContain("stripe.charges.retrieve(intent.latest_charge)");
    expect(source).not.toContain("latest_charge.payment_method");
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("UPDATE enrollments");
  });
});
