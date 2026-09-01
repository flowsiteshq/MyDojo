import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const scriptPath = path.resolve(import.meta.dirname, "../scripts/send-weather-closure-notice.ts");
const source = fs.readFileSync(scriptPath, "utf8");

describe("weather closure notice campaign", () => {
  it("locks delivery to explicit approval, the approved 28-household audience, and the exact closure notice", () => {
    expect(source).toContain('WEATHER_CLOSURE_APPROVED !== "send-27"');
    expect(source).toContain("const EXPECTED_AUDIENCE_COUNT = 27");
    expect(source).toContain("LOWER(TRIM(e.customerName)) <> 'brenda galvez'");
    expect(source).toContain("sc.optedOut = 0");
    expect(source).toContain("await validate800Credentials()");
    expect(source).toContain("there will be no adult class this afternoon");
  });

  it("records per-recipient outcomes and prevents a duplicate weather-closure text to the same conversation", () => {
    expect(source).toContain("SELECT id FROM smsMessages WHERE conversationId = ?");
    expect(source).toContain('status: "already-recorded"');
    expect(source).toContain("senderType = 'campaign'");
    expect(source).not.toContain("Promise.all(");
  });
});
