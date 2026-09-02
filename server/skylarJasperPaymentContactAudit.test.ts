import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/audit-skylar-jasper-payment-contact.ts"), "utf8");

describe("Skylar Jasper payment contact audit", () => {
  it("uses only read-only customer searches and masks phone values", () => {
    expect(source).toContain("stripe.customers.search(");
    expect(source).toContain("function maskPhone");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".del(");
  });
});
