import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/audit-disputed-september14-subscription-periods.mjs", import.meta.url), "utf8");

describe("disputed September 14 subscription-period audit", () => {
  it("is read-only and captures subscription periods, invoice-line periods, and payment timestamps", () => {
    expect(source).toContain('action: "read-only disputed September 14 subscription-period audit"');
    expect(source).toContain("billingCycleAnchor");
    expect(source).toContain("currentPeriodStart");
    expect(source).toContain("currentPeriodEnd");
    expect(source).toContain("paymentIntentCreatedAt");
    expect(source).toContain("periodStart");
    expect(source).toContain("periodEnd");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".pay(");
  });
});
