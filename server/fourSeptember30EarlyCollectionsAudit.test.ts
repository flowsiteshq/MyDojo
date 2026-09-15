import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/audit-four-september-30-early-collections.mjs", import.meta.url), "utf8");

describe("four September 30 early-collection audit", () => {
  it("is strictly read-only and verifies all approved invoices plus the Cintia exclusion", () => {
    expect(source).toContain('action: "read-only four September 30 early-collection verification"');
    expect(source).toContain('student: "Luis Fabrizzio Zuart Cernuda"');
    expect(source).toContain('student: "Emerson"');
    expect(source).toContain('student: "Hadley"');
    expect(source).toContain('student: "Kenna"');
    expect(source).toContain("const CINTIA_CUSTOMER_ID");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".pay(");
  });
});
