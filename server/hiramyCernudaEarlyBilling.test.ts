import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const executionPath = path.resolve(testDirectory, "../scripts/execute-hiramy-cernuda-early-billing.mjs");

describe("Hiramy Cernuda early billing", () => {
  it("requires the exact $149.00 approval guard and limits action to the verified subscription", () => {
    const source = fs.readFileSync(executionPath, "utf8");

    expect(source).toContain('HIRAMY_CERNUDA_EARLY_BILLING_APPROVED !== "approve-14900"');
    expect(source).toContain("const approvedAmountCents = 14_900");
    expect(source).toContain('const subscriptionId = "sub_1U9XB6L2gHbMVosgbxyh9DDa"');
  });

  it("blocks existing invoice collection and advances only the existing future trial", () => {
    const source = fs.readFileSync(executionPath, "utf8");

    expect(source).toContain('stripe.invoices.list({ subscription: subscriptionId, status: "open", limit: 5 })');
    expect(source).toContain("not_billed_existing_invoice_guard");
    expect(source).toContain('{ trial_end: "now", proration_behavior: "none" }');
    expect(source).toContain("idempotencyKey:");
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });
});
