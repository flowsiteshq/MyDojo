import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/collect-four-september15-corrective-subscription-invoices.mjs", import.meta.url), "utf8");

describe("four-account September 15 corrective collection", () => {
  it("requires an explicit execution flag and exact subscription-linked invoice evidence", () => {
    expect(source).toContain("COLLECT_FOUR_SEPTEMBER15_CORRECTIVE_SUBSCRIPTION_INVOICES_APPROVED");
    expect(source).toContain("historicalInvoiceId");
    expect(source).toContain("corrective_collection_key");
    expect(source).toContain("subscription: target.subscriptionId");
    expect(source).toContain("period: { start: item.current_period_start, end: item.current_period_end }");
    expect(source).toContain("paymentIntents.some(intent => intent.status === \"succeeded\")");
  });

  it("does not reset subscription billing anchors while the current period is already on the requested date", () => {
    expect(source).not.toContain("subscriptions.update");
    expect(source).not.toContain("billing_cycle_anchor");
    expect(source).not.toContain("trial_end");
  });
});
