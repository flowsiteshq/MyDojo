import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const recoveryScriptPath = path.resolve(testDirectory, "../scripts/execute-pham-legacy-recovery.mjs");

describe("Pham legacy recovery", () => {
  it("requires a specific approval guard and protects against duplicate recovery charges", () => {
    const source = fs.readFileSync(recoveryScriptPath, "utf8");

    expect(source).toContain('PHAM_LEGACY_RECOVERY_APPROVED !== "approve-23242"');
    expect(source).toContain('orderId = `pham-${String(today.month).padStart(2, "0")}${String(today.day).padStart(2, "0")}-${String(today.year).slice(-2)}`');
    expect(source).toContain('order_id: { operator: "=", value: orderId }');
    expect(source).toContain("not_charged_duplicate_guard");
  });

  it("updates only the known subscription and does not create a second subscription", () => {
    const source = fs.readFileSync(recoveryScriptPath, "utf8");

    expect(source).toContain('const subscriptionId = "d7p9fhn0i47d4m61mic0"');
    expect(source).toContain('`/api/recurring/subscription/${subscriptionId}`');
    expect(source).not.toContain('"/api/recurring/subscription",');
    expect(source).toContain("next_bill_date: nextBillDate");
    expect(source).toContain("billing_cycle_interval: 1");
  });

  it("uses the approved membership amount and records the expected all-in total for verification", () => {
    const source = fs.readFileSync(recoveryScriptPath, "utf8");

    expect(source).toContain("const approvedMembershipAmountCents = 22_350");
    expect(source).toContain("const approvedTotalAmountCents = 23_242");
    expect(source).toContain("amount: approvedMembershipAmountCents");
  });
});
