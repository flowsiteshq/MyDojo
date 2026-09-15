import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/collect-four-september-30-subscriptions-early.mjs", import.meta.url), "utf8");

describe("retired September 30 early-collection workflow", () => {
  it("can only inspect readiness and cannot create payments or alter subscription dates", () => {
    expect(source).toContain("collection operation retired");
    expect(source).toContain("read-only September 30 renewal readiness check");
    expect(source).not.toContain("subscriptions.update");
    expect(source).not.toContain("paymentIntents.create");
    expect(source).not.toContain("invoices.create");
    expect(source).not.toContain("invoices.pay");
  });
});
