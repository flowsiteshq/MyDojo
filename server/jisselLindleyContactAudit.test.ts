import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const scriptPath = path.resolve(import.meta.dirname, "../scripts/audit-jissel-lindley-contact.ts");
const source = fs.readFileSync(scriptPath, "utf8");

describe("Jissel Lindley contact audit", () => {
  it("uses only read-only payment-account lookups and masks phone data in its persisted result", () => {
    expect(source).toContain("stripe.customers.search(");
    expect(source).toContain("stripe.checkout.sessions.list(");
    expect(source).toContain("function maskedPhone");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".del(");
  });
});
