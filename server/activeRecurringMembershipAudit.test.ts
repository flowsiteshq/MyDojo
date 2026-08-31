import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/audit-active-recurring-memberships.mjs"), "utf8");

describe("active recurring membership audit", () => {
  it("classifies every active enrollment without performing payment or subscription mutations", () => {
    expect(source).toContain("WHERE e.status = 'active'");
    expect(source).toContain("stripe.subscriptions.retrieve");
    expect(source).toContain("live_active_recurring");
    expect(source).toContain("live_future_recurring");
    expect(source).toContain("legacy_recurring_reference_unverified");
    expect(source).toContain("missing_recurring_setup");
    expect(source).not.toContain("stripe.subscriptions.create");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });
});
