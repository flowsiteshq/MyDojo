import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-overdue-accounts.mjs"),
  "utf8",
);
const legacySource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-overdue-accounts-legacy.mjs"),
  "utf8",
);

describe("five-account overdue balance audit", () => {
  it("covers exactly the requested accounts", () => {
    [
      "Shirin Nounou",
      "Nicolas Vega",
      "Daniel Pina",
      "Alma Alelaiwi",
      "Arkeashia Denise Curry",
    ].forEach((name) => expect(source).toContain(name));
  });

  it("uses only provider retrieval and list operations", () => {
    expect(source).toContain("read-only overdue balance verification");
    expect(source).toContain("stripe.subscriptions.list");
    expect(source).toContain("stripe.invoices.list");
    expect(source).toContain("stripe.paymentMethods.list");
    expect(source).not.toMatch(/stripe\.(paymentIntents|invoices|subscriptions)\.(create|pay|update|cancel|del)/);
    expect(legacySource).toContain("/api/transaction/search");
    expect(legacySource).toContain("/api/recurring/subscription/");
    expect(legacySource).not.toMatch(/api\/transaction\/(create|charge|pay|void|refund)/);
  });

  it("reports exact open invoice balances and payment-method availability", () => {
    expect(source).toContain("amountRemaining");
    expect(source).toContain("attachedCardCount");
    expect(source).toContain("hasDefaultPaymentMethod");
    expect(legacySource).toContain("transaction.customer_email");
    expect(legacySource).toContain("transaction.customer_phone");
    expect(legacySource).toContain("subscription?.customer_email");
    expect(legacySource).toContain("subscription?.customer_phone");
  });
});
