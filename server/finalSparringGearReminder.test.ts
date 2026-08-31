import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const campaignPath = path.resolve(testDirectory, "../scripts/send-final-sparring-gear-reminder.ts");

describe("final sparring gear reminder", () => {
  it("locks delivery to explicit approval, the approved 28-household audience, and the exact final-day message", () => {
    const source = fs.readFileSync(campaignPath, "utf8");

    expect(source).toContain('GEAR_FINAL_REMINDER_APPROVED !== "send-28"');
    expect(source).toContain("const EXPECTED_AUDIENCE_COUNT = 28");
    expect(source).toContain("LOWER(TRIM(e.customerName)) <> 'brenda galvez'");
    expect(source).toContain("sc.optedOut = 0");
    expect(source).toContain("await validate800Credentials()");
    expect(source).toContain("today is the last day to reserve");
    expect(source).toContain("$195");
    expect(source).toContain("https://www.mydojoma.com/shop");
  });

  it("records one delivery outcome per eligible recipient and contains no retry loop", () => {
    const source = fs.readFileSync(campaignPath, "utf8");

    expect(source).toContain("senderType, body, externalId, status");
    expect(source).toContain('outcome.success ? "sent" : "failed"');
    expect(source).toContain("acceptedCount");
    expect(source).toContain("failedCount");
    expect(source).not.toContain("retry");
  });
});
