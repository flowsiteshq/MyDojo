import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/audit-phone-trial-label-payment-state.mjs", import.meta.url), "utf8");

describe("phone trial-label payment-state audit", () => {
  it("is read-only and retrieves matching customer, subscription, invoice, payment-intent, card, and message evidence", () => {
    expect(source).toContain("stripe.customers.search");
    expect(source).toContain("stripe.subscriptions.list");
    expect(source).toContain("stripe.invoices.list");
    expect(source).toContain("stripe.paymentIntents.list");
    expect(source).toContain("stripe.checkout.sessions.list");
    expect(source).toContain("smsConversations");
    expect(source).not.toContain("stripe.invoices.create");
    expect(source).not.toContain("stripe.invoices.pay");
    expect(source).not.toContain("stripe.subscriptions.update");
    expect(source).not.toContain("stripe.paymentIntents.create");
  });
});
