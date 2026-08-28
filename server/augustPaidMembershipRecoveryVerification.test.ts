import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/verify-august-paid-membership-recovery.mjs"), "utf8");

describe("August paid-membership recovery verification", () => {
  it("checks all recovered records, subscription trial dates, and recovery-day charge results without mutations", () => {
    expect(source).toContain("const enrollmentIds = [1170001, 1200004, 1200005, 1200006, 1230001, 1260001, 1290001, 1320001, 1350001, 1410001, 1500001]");
    expect(source).toContain("stripe.subscriptions.retrieve");
    expect(source).toContain("stripe.invoices.list");
    expect(source).toContain("unexpectedImmediateCharge");
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("UPDATE enrollments");
  });
});
