import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditPath = path.resolve(testDirectory, "../scripts/audit-lauren-craig-recurring.mjs");

describe("Lauren Craig recurring audit", () => {
  it("is restricted to read-only enrollment, subscription, and invoice inspection", () => {
    const source = fs.readFileSync(auditPath, "utf8");

    expect(source).toContain("stripe.subscriptions.retrieve(subscriptionId)");
    expect(source).toContain("stripe.invoices.list({ subscription: subscriptionId, limit: 5 })");
    expect(source).toContain("auditOnly: true");
    expect(source).not.toContain("stripe.subscriptions.update");
    expect(source).not.toContain("stripe.invoices.pay");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });
});
