import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const webhook = fs.readFileSync(path.resolve(import.meta.dirname, "stripeWebhook.ts"), "utf8");

describe("Back-to-School recurring activation", () => {
  it("uses the server-issued 14-day tuition start and does not mark the first month as prepaid", () => {
    expect(webhook).toContain('session.metadata?.backToSchool === "true"');
    expect(webhook).toContain("session.metadata?.billingStartAt");
    expect(webhook).toContain("trial_end: Math.floor(tuitionStartDate.getTime() / 1000)");
    expect(webhook).toContain('session.metadata?.firstMonthPrepaid === "false" ? false');
  });
});
