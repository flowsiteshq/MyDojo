import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditPath = path.resolve(testDirectory, "../scripts/audit-uploaded-billing-list.mjs");

describe("uploaded billing list audit", () => {
  it("covers every requested student using read-only payment lookups", () => {
    const source = fs.readFileSync(auditPath, "utf8");

    expect(source).toContain('const requestedStudents = [');
    expect(source).toContain('"Logan Pham"');
    expect(source).toContain('"Kevin Kessel Domini"');
    expect(source).toContain("stripe.charges.list({");
    expect(source).toContain("method: \"POST\"");
    expect(source).toContain("/api/transaction/search");
    expect(source).toContain("auditOnly: true");
  });

  it("cannot create, update, retry, or schedule billing", () => {
    const source = fs.readFileSync(auditPath, "utf8");

    expect(source).not.toContain("stripe.charges.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
    expect(source).not.toContain("stripe.invoices.pay");
    expect(source).not.toContain("stripe.subscriptions.update");
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toMatch(/\/api\/transaction["'`]/);
  });
});
