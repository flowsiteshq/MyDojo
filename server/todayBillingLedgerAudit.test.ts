import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/audit-today-billing-ledger.mjs", import.meta.url), "utf8");

describe("today billing ledger audit", () => {
  it("is read-only and reports same-day Stripe and historical records", () => {
    expect(source).toContain('action: "read-only same-day billing ledger"');
    expect(source).toContain('timeZone: "America/Chicago"');
    expect(source).toContain("stripe.invoices.list");
    expect(source).toContain("/api/transaction/search");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".pay(");
  });
});
