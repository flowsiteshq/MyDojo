import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditScriptPath = path.resolve(testDirectory, "../scripts/audit-pham-fluidpay-recurring.mjs");

describe("Pham legacy recurring audit", () => {
  it("uses only a read-only subscription lookup and records an audit-only result", () => {
    const source = fs.readFileSync(auditScriptPath, "utf8");

    expect(source).toContain('method: "GET"');
    expect(source).toContain('/api/recurring/subscription/${subscriptionId}');
    expect(source).toContain('/api/recurring/plan/${planId}');
    expect(source).toContain("auditOnly: true");
    expect(source).toContain("/api/transaction/search");
    expect(source).toContain('method: "POST"');
    expect(source).toContain("subscription_id: { operator: \"=\", value: subscriptionId }");
    expect(source).not.toContain('method: "PATCH"');
    expect(source).not.toContain('method: "DELETE"');
  });

  it("limits persisted subscription data to approved operational fields", () => {
    const source = fs.readFileSync(auditScriptPath, "utf8");

    expect(source).toContain("allowedSubscriptionFields");
    expect(source).toContain("pickSubscriptionFields(subscriptionRecord)");
    expect(source).toContain("summarizeEvents(subscriptionRecord.events)");
    expect(source).toContain("serviceFee");
    expect(source).toContain("surcharge");
    expect(source).not.toContain("console.log(rawText)");
  });
});
