import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "..", "scripts", "audit-stripe-next-30-days-payment-schedule.mjs"),
  "utf8",
);

describe("30-day Stripe payment schedule audit", () => {
  it("uses a fixed Eastern 30-calendar-day reporting window", () => {
    expect(source).toContain('const TIME_ZONE = "America/New_York"');
    expect(source).toContain("const DAYS_AHEAD = 30");
    expect(source).toContain("const windowEndExclusive = easternDayStartUnix(endDate.year, endDate.month, endDate.day)");
  });

  it("separates scheduled renewals from past-due balances", () => {
    expect(source).toContain('schedule.state === "scheduled_automatic_renewal"');
    expect(source).toContain('subscription.status === "past_due"');
    expect(source).toContain("delinquentNowOpenBalance");
  });

  it("does not perform payment or subscription mutations", () => {
    expect(source).toContain('action: "read-only 30-day Stripe recurring payment schedule"');
    for (const forbidden of [
      ".paymentIntents.create(",
      ".paymentIntents.confirm(",
      ".invoices.pay(",
      ".subscriptions.create(",
      ".subscriptions.update(",
      ".subscriptions.cancel(",
      ".refunds.create(",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
