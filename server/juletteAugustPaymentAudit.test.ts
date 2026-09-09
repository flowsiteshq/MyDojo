import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-julette-august-payment.mjs"),
  "utf8",
);

describe("Julette McDonald August payment audit", () => {
  it("checks the recorded household spelling and the full August window", () => {
    expect(source).toContain('const TARGET_NAME = "Julette McDonald"');
    expect(source).toContain('AUGUST_START = Math.floor(Date.UTC(2026, 7, 1) / 1000)');
    expect(source).toContain('SEPTEMBER_START = Math.floor(Date.UTC(2026, 8, 1) / 1000)');
  });

  it("is read-only and reconciles current and historical payment records", () => {
    expect(source).toContain('stripe.subscriptions.retrieve');
    expect(source).toContain('stripe.invoices.list');
    expect(source).toContain('FROM customPaymentLinkPayments');
    expect(source).not.toMatch(/\.create\s*\(/);
    expect(source).not.toMatch(/\.update\s*\(/);
    expect(source).not.toMatch(/\.del\s*\(/);
  });
});
