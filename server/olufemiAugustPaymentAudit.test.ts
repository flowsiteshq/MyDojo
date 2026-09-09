import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-olufemi-august-payment.mjs"),
  "utf8",
);

describe("Olufemi August payment audit", () => {
  it("is strictly read-only across the current and legacy providers", () => {
    expect(source).toContain("stripe.customers.search");
    expect(source).toContain("stripe.paymentIntents.list");
    expect(source).toContain('method: "POST"');
    expect(source).toContain("/api/transaction/search");
    expect(source).not.toContain("/api/transaction\", {");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });

  it("limits reported transactions to August 2026", () => {
    expect(source).toContain("2026-08-01T00:00:00Z");
    expect(source).toContain("2026-09-01T00:00:00Z");
    expect(source).toContain('startsWith("2026-08")');
  });

  it("checks common stored variants of Olufemi Alabi Isama’s name", () => {
    expect(source).toContain("Femi Alabi-Isama");
    expect(source).toContain("Olufemi Alabi-Isama");
    expect(source).toContain("LEGACY_NAME_VARIANTS");
  });

  it("cross-checks the verified legacy household and subscription references", () => {
    expect(source).toContain("d7joq1f0i47d6t3lhv0g");
    expect(source).toContain("d7joqln0i47d4m4tbt8g");
    expect(source).toContain("currentSubscription");
  });
});
