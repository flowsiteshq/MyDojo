import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/generate-august-2026-collections-report.mjs"),
  "utf8",
);

describe("August collections report", () => {
  it("uses the successful charge ledger with explicit August and four-day New York windows", () => {
    expect(source).toContain('"2026-08-01T04:00:00.000Z"');
    expect(source).toContain('"2026-08-27T04:00:00.000Z"');
    expect(source).toContain('charge.paid && charge.status === "succeeded"');
  });

  it("reports gross charges, refunds, and net collections separately", () => {
    expect(source).toContain("grossCollectedCents");
    expect(source).toContain("refundedCents");
    expect(source).toContain("netCollectedCents");
  });
});
