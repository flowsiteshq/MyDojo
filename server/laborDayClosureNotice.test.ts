import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("Labor Day closure notice", () => {
  const source = fs.readFileSync("scripts/send-labor-day-closure-notice.ts", "utf8");

  it("requires the explicit 31-contact execution lock", () => {
    expect(source).toContain('LABOR_DAY_CLOSURE_APPROVED !== "send-31"');
    expect(source).toContain("EXPECTED_AUDIENCE_COUNT = 31");
  });

  it("excludes Brenda and opted-out contacts while deduplicating phones", () => {
    expect(source).toContain("LOWER(TRIM(e.customerName)) <> 'brenda galvez'");
    expect(source).toContain("LOWER(TRIM(COALESCE(u.name, ''))) <> 'brenda galvez'");
    expect(source).toContain("sc.optedOut = 1");
    expect(source).toContain("GROUP BY phoneDigits");
  });

  it("does not resend a matching campaign message already in a recipient conversation", () => {
    expect(source).toContain("status: \"already-recorded\"");
    expect(source).toContain("senderType = 'campaign'");
  });
});
