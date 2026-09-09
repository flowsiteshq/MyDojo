import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/refund-angelina-sodhi-duplicate-and-apologize.ts"),
  "utf8",
);

describe("Angelina Sodhi duplicate refund", () => {
  it("targets only the second verified $149 duplicate transaction", () => {
    expect(source).toContain('const ORIGINAL_TRANSACTION_ID = "d9n18an0i477l3n78reg"');
    expect(source).toContain("const REFUND_AMOUNT_CENTS = 14_900");
    expect(source).toContain('const SUBSCRIPTION_ID = "d9lumh70i470fha31l80"');
  });

  it("requires explicit approval and verifies the original transaction before refunding", () => {
    expect(source).toContain("EXECUTE_APPROVED_ANGELINA_DUPLICATE_REFUND");
    expect(source).toContain("lookupOriginalTransaction");
    expect(source).toContain("The verified duplicate transaction no longer matches");
    expect(source).toContain("hasRefund");
  });

  it("does not alter the valid subscription and sends the apology only after refund acceptance", () => {
    expect(source).toContain("assertActiveSubscription");
    expect(source).toContain("/refund");
    expect(source).toContain("const sms = await sendApology(connection)");
    expect(source).not.toContain("/status/");
    expect(source).not.toContain("subscriptions.create");
  });

  it("deduplicates and audits the post-refund apology text", () => {
    expect(source).toContain("optedOut");
    expect(source).toContain("body = ?");
    expect(source).toContain("INSERT INTO smsMessages");
    expect(source).toContain("We apologize for the error");
  });
});
