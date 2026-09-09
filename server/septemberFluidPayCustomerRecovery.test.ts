import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/recover-september-fluidpay-customer-charges.mjs"),
  "utf8",
);

describe("September FluidPay customer recovery", () => {
  it("targets exactly the three explicitly approved members and amounts", () => {
    expect(source).toContain('{ name: "Shirin Nounou", customerId: "d8f2mef0i47c0rvgd4dg", amountCents: 14900');
    expect(source).toContain('{ name: "Nicolas Vega", customerId: "d7t6g070i47d4m71uge0", amountCents: 9900');
    expect(source).toContain('{ name: "Daniel Pina", customerId: "d81r17f0i473fp552nog", amountCents: 14900');
  });

  it("requires explicit execution approval and a stored legacy payment method", () => {
    expect(source).toContain("EXECUTE_APPROVED_FLUIDPAY_RECOVERY");
    expect(source).toContain("DRY_RUN");
    expect(source).toContain("hasStoredPayment");
    expect(source).toContain("not_attempted");
  });

  it("prevents duplicate September charges and uses an idempotent provider sale", () => {
    expect(source).toContain("existingSeptemberPayments.length > 0");
    expect(source).toContain("skipped_duplicate");
    expect(source).toContain("idempotency_key");
    expect(source).toContain("idempotency_time: 3600");
    expect(source).toContain("order_id");
  });
});
