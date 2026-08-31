import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const executionPath = path.resolve(testDirectory, "../scripts/execute-lauren-craig-early-billing.mjs");

describe("Lauren Craig early billing", () => {
  it("requires the exact $298.00 approval guard and limits the scope to the three verified subscriptions", () => {
    const source = fs.readFileSync(executionPath, "utf8");

    expect(source).toContain('LAUREN_CRAIG_EARLY_BILLING_APPROVED !== "approve-29800"');
    expect(source).toContain("const approvedTotalCents = 29_800");
    expect(source).toContain("const subscriptionIds = [");
    expect(source).toContain('"sub_1U9X8gL2gHbMVosgilDuyToK"');
    expect(source).toContain('"sub_1U9X8iL2gHbMVosgm5XuIOUh"');
    expect(source).toContain('"sub_1U9X8jL2gHbMVosgGrK693CG"');
  });

  it("guards against existing invoice collection and only advances the existing trial subscriptions", () => {
    const source = fs.readFileSync(executionPath, "utf8");

    expect(source).toContain('stripe.invoices.list({ subscription: subscriptionId, status: "open", limit: 5 })');
    expect(source).toContain("not_billed_existing_invoice_guard");
    expect(source).toContain('{ trial_end: "now", proration_behavior: "none" }');
    expect(source).toContain("idempotencyKey:");
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });
});
