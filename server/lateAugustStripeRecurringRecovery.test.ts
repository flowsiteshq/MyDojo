import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/recover-late-august-stripe-recurring-subscriptions.mjs"),
  "utf8",
);

describe("late-August Stripe recurring recovery", () => {
  it("requires explicit approval and creates future-trial subscriptions without a recovery-day collection", () => {
    expect(source).toContain('RECOVER_LATE_AUGUST_SUBSCRIPTIONS_APPROVED');
    expect(source).toContain('trial_end: FIRST_BILLING_AT');
    expect(source).toContain('noRecoveryDayCharge: "true"');
    expect(source).toContain('willCreateCharge: false');
    expect(source).toContain('if (dryRun)');
    expect(source).toContain('const resolvedDiscountPriceId = await findOrCreateFamilyDiscountPrice(stripe);');
  });

  it("restricts recovery to the four approved records and checks each saved authorization", () => {
    expect(source).toContain('const RECOVERIES = [');
    expect(source).toContain('setup_future_usage !== "off_session"');
    expect(source).toContain('Duplicate recovered subscriptions detected');
    expect(source).toContain('late-august-anushree-srijit-1530001');
    expect(source).toContain('late-august-cintia-foundation');
  });

  it("does not create payment intents, invoices, refunds, or cancellation actions", () => {
    expect(source).not.toMatch(/stripe\.(paymentIntents|invoices|refunds)\.(create|update|pay|voidInvoice)\s*\(/);
    expect(source).not.toMatch(/stripe\.subscriptions\.(cancel|del)\s*\(/);
  });
});
