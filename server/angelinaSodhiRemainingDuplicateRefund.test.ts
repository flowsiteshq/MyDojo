import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/refund-angelina-sodhi-remaining-duplicate.ts"),
  "utf8",
);

describe("Angelina Sodhi remaining duplicate refund", () => {
  it("targets only the remaining verified August 1 $149 transaction", () => {
    expect(source).toContain('const ORIGINAL_TRANSACTION_ID = "d9n16pf0i477l3n78670"');
    expect(source).toContain("const REFUND_AMOUNT_CENTS = 14_900");
    expect(source).toContain('const SUBSCRIPTION_ID = "d9lumh70i470fha31l80"');
  });

  it("requires explicit execution approval and prevents a repeat refund", () => {
    expect(source).toContain("EXECUTE_APPROVED_ANGELINA_REMAINING_DUPLICATE_REFUND");
    expect(source).toContain("alreadyRefunded");
    expect(source).toContain("remaining duplicate already refunded");
  });

  it("preserves the active membership and does not send another SMS", () => {
    expect(source).toContain("Angelina’s valid active monthly subscription");
    expect(source).toContain("/refund");
    expect(source).toContain("no second SMS sent");
    expect(source).not.toContain("sendSms");
    expect(source).not.toContain("/status/");
  });
});
