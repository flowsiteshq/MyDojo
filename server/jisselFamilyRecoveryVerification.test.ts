import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Jissel family recovery verification", () => {
  it("uses only read-only payment and subscription lookup operations", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "scripts/verify-jissel-family-recovery.mjs"),
      "utf8",
    );
    expect(source).toContain("paymentIntents.list");
    expect(source).toContain("subscriptions.list");
    expect(source).not.toMatch(/\.create\s*\(/);
    expect(source).not.toMatch(/\.update\s*\(/);
    expect(source).not.toMatch(/\.confirm\s*\(/);
  });
});
