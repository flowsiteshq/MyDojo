import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/collect-four-september-30-subscriptions-early.mjs", import.meta.url), "utf8");

describe("four September 30 early collections", () => {
  it("is locked to the four approved existing Stripe subscriptions and excludes other accounts", () => {
    expect(source).toContain('const EXECUTION_FLAG = "COLLECT_FOUR_SEPTEMBER_30_SUBSCRIPTIONS_APPROVED"');
    expect(source).toContain('student: "Luis Fabrizzio Zuart Cernuda"');
    expect(source).toContain('student: "Emerson"');
    expect(source).toContain('student: "Hadley"');
    expect(source).toContain('student: "Kenna"');
    expect(source).not.toContain("Cintia Garza");
    expect(source).toContain('billing_cycle_anchor: "now"');
  });

  it("blocks duplicates and retries only no payment automatically", () => {
    expect(source).toContain("already has a paid September invoice");
    expect(source).toContain("already has an unpaid invoice");
    expect(source).toContain("already has an early-collection recovery invoice");
    expect(source).toContain("not retried after early collection attempt");
  });
});
