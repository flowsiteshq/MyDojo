import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const webhook = fs.readFileSync(path.resolve(import.meta.dirname, "./stripeWebhook.ts"), "utf8");

describe("Link recurring activation", () => {
  it("does not reject a reusable Link payment method after Checkout saved it for off-session use", () => {
    expect(webhook).toContain('!["card", "link"].includes(paymentMethod.type)');
    expect(webhook).toContain('paymentMethod.type === "link" ? "link" : null');
  });
});
