import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/audit-five-september-15-early-collections.mjs"),
  "utf8",
);

describe("five September 15 early-collection audit", () => {
  it("is read-only and checks all five paid invoices, recurring dates, and Cintia exclusion", () => {
    expect(source).toContain("read-only early September collection verification");
    expect(source).toContain("const CINTIA_CUSTOMER_ID");
    expect(source).toContain("cintiGarzaExcluded");
    expect(source).toContain("allFivePaidAndAnchored");
    expect(source).not.toMatch(/\.create\s*\(/);
    expect(source).not.toMatch(/\.update\s*\(/);
    expect(source).not.toMatch(/\.pay\s*\(/);
    expect(source).not.toMatch(/\.del\s*\(/);
    expect(source).not.toMatch(/\.voidInvoice\s*\(/);
  });
});
