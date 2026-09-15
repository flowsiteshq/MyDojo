import { describe, expect, it } from "vitest";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/verify-four-september15-corrective-subscription-collections.mjs", import.meta.url), "utf8");

describe("four-account corrective collection verification", () => {
  it("is read-only and returns payment-intent evidence, invoice coverage, and subscription periods", () => {
    expect(source).toContain('action: "read-only four-account corrective collection verification"');
    expect(source).toContain("paymentIntents");
    expect(source).toContain("currentPeriodEnd");
    expect(source).toContain("corrective_collection_key");
    expect(source).not.toContain(".create(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".pay(");
  });
});
