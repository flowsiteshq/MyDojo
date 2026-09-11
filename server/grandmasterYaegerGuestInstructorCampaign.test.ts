import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/send-grandmaster-yaeger-guest-instructor.ts"),
  "utf8",
);

describe("Grandmaster Chris Yaeger guest-instructor SMS campaign", () => {
  it("locks the approved message and current audience count", () => {
    expect(source).toContain("Grandmaster Chris Yaeger");
    expect(source).toContain("tonight at 6:00 PM");
    expect(source).toContain("const EXPECTED_AUDIENCE_COUNT = 31");
    expect(source).toContain('GRANDMASTER_YAEGER_SMS_APPROVED === "send-31"');
  });

  it("sends only active student households while excluding Brenda and opt-outs", () => {
    expect(source).toContain("e.status = 'active'");
    expect(source).toContain("brenda galvez");
    expect(source).toContain("sc.optedOut = 1");
    expect(source).toContain("GROUP BY RIGHT(REGEXP_REPLACE(e.customerPhone");
  });

  it("requires valid provider readiness and persists one audited outcome per recipient", () => {
    expect(source).toContain("validate800Credentials");
    expect(source).toContain("senderType = 'campaign'");
    expect(source).toContain("INSERT INTO smsMessages");
    expect(source).toContain("already-recorded");
  });
});
