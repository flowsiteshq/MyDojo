import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Hiramy and Jissel charge-readiness audit", () => {
  it("uses only read-only Stripe retrieval methods and redacts payment details", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "scripts/audit-hiramy-jissel-charge-readiness.mjs"),
      "utf8",
    );

    expect(source).toContain("subscriptions.retrieve");
    expect(source).toContain("customers.search");
    expect(source).toContain("invoices.list");
    expect(source).toContain("paymentMethods.list");
    expect(source).toContain("checkout.sessions.list");
    expect(source).toContain("checkout.sessions.listLineItems");
    expect(source).toContain("paymentIntents.retrieve");
    expect(source).toContain("phoneSuffix");
    expect(source).not.toMatch(/\.charges\.create\s*\(/);
    expect(source).not.toMatch(/\.paymentIntents\.create\s*\(/);
    expect(source).not.toMatch(/\.invoices\.pay\s*\(/);
    expect(source).not.toMatch(/\.subscriptions\.create\s*\(/);
    expect(source).not.toMatch(/\.subscriptions\.update\s*\(/);
  });
});
