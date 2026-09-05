import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Jissel family billing recovery", () => {
  it("requires approval, guards against duplicate recovery payments, and delays recurring billing to the fifth", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "scripts/recover-jissel-family-billing.mjs"),
      "utf8",
    );

    expect(source).toContain('JISSEL_FAMILY_RECOVERY_APPROVED !== "charge-272-and-subscribe"');
    expect(source).toContain('const AMOUNT_CENTS = 27_200');
    expect(source).toContain('recoveryKey: RECOVERY_KEY');
    expect(source).toContain('payment.metadata?.recoveryKey === RECOVERY_KEY');
    expect(source).toContain('subscription.metadata?.recoveryKey === RECOVERY_KEY');
    expect(source).toContain('setup_future_usage !== "off_session"');
    expect(source).toContain('trial_end: nextFifthOfMonth()');
    expect(source).toContain('billingDay: "5"');
    expect(source).toContain("stripe.prices.create");
    expect(source).toContain("price: recurringPrice.id");
    expect(source).not.toContain("price_data:");
    expect(source).not.toContain("checkout.sessions.create(");
  });
});
