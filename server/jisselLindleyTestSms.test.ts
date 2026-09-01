import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const scriptPath = path.resolve(import.meta.dirname, "../scripts/send-jissel-lindley-test-sms.ts");
const source = fs.readFileSync(scriptPath, "utf8");

describe("Jissel Lindley test SMS", () => {
  it("locks delivery to one explicit approval and the named paid-checkout customer", () => {
    expect(source).toContain('JISSEL_TEST_SMS_APPROVED !== "send-one"');
    expect(source).toContain('const CUSTOMER_ID = "cus_V79VBV7o7QC44l"');
    expect(source).toContain('const EXPECTED_NAME = "jissel lindley"');
    expect(source).toContain("await validate800Credentials()");
  });

  it("checks opt-out status and prevents the same test text from being sent twice", () => {
    expect(source).toContain("conversations[0]?.optedOut === 1");
    expect(source).toContain("SELECT id FROM smsMessages WHERE conversationId = ?");
    expect(source).toContain("same test message was already recorded");
    expect(source).toContain("'outbound', 'human'");
    expect(source).toContain("phoneSuffix");
  });
});
