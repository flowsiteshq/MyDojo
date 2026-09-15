import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/audit-disputed-september14-invoice-state.mjs", import.meta.url), "utf8");

describe("disputed September 14 invoice-state audit", () => {
  it("is read-only and exposes payment evidence for only the four disputed invoices", () => {
    expect(source).toContain('action: "read-only disputed September 14 invoice-state audit"');
    expect(source).toContain('student: "Luis Fabrizzio Zuart Cernuda"');
    expect(source).toContain('student: "Emerson"');
    expect(source).toContain('student: "Hadley"');
    expect(source).toContain('student: "Kenna"');
    expect(source).toContain("paidOutOfBand");
    expect(source).toContain("paymentIntentStatus");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".pay(");
  });
});
