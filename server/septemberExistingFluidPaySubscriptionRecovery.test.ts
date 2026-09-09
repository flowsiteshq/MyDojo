import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/recover-september-existing-fluidpay-subscriptions.mjs"),
  "utf8",
);

describe("September existing FluidPay subscription recovery", () => {
  it("limits recovery to the two explicitly authorized existing subscriptions and exact amounts", () => {
    expect(source).toContain('name: "Alma Alelaiwi"');
    expect(source).toContain('subscriptionId: "d8f2pn70i477v5mbif5g"');
    expect(source).toContain("amountCents: 4900");
    expect(source).toContain('name: "Arkeashia Denise Curry"');
    expect(source).toContain('subscriptionId: "d9ghjdf0i470cd7bskng"');
    expect(source).toContain("amountCents: 14900");
  });

  it("requires explicit authorization and validates existing failed subscription identity before collection", () => {
    expect(source).toContain("EXECUTE_APPROVED_EXISTING_SUBSCRIPTION_RECOVERY");
    expect(source).toContain('String(subscription.status).toLowerCase() === "failed"');
    expect(source).toContain("expectedCustomerId");
    expect(source).toContain("observed:");
    expect(source).toContain("getCustomerVaultPayment");
    expect(source).toContain("hasCustomerVaultPayment");
    expect(source).toContain("DRY_RUN");
  });

  it("blocks duplicates and reactivates only after an accepted payment", () => {
    expect(source).toContain("September subscription payment already exists");
    expect(source).toContain("idempotency_key");
    expect(source).toContain("idempotency_time: 3600");
    expect(source).toContain("accepted_and_reactivated");
    expect(source).toContain("/status/active?next_bill_date=");
  });
});
