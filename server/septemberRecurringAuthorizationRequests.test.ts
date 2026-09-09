import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/create-september-recurring-authorization-requests.mjs"),
  "utf8",
);

describe("September Stripe recurring authorization requests", () => {
  it("contains the approved members and exact monthly amounts", () => {
    expect(source).toContain('{ name: "Shirin Nounou", amount: 149.00 }');
    expect(source).toContain('{ name: "Nicolas Vega", amount: 99.00 }');
    expect(source).toContain('{ name: "Daniel Pina", amount: 149.00 }');
    expect(source).toContain('{ name: "Alma Alelaiwi", amount: 49.00 }');
    expect(source).toContain('{ name: "Arkeashia Denise Curry", amount: 149.00 }');
  });

  it("uses Stripe-facing recurring authorization links and never creates legacy payment activity", () => {
    expect(source).toContain("'recurring'");
    expect(source).toContain("'monthly'");
    expect(source).toContain("September 2026 Monthly Tuition");
    expect(source).not.toMatch(/fluidpay|FLUIDPAY|api\.fluidpay/i);
  });

  it("prevents duplicate active links and duplicate delivery submissions", () => {
    expect(source).toContain("title = ? AND isActive = 1");
    expect(source).toContain("hasExistingDeliveryAudit");
    expect(source).toContain("deliverySkippedBecauseAlreadyRecorded");
  });
});
