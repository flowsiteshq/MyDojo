import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("Daniel Pina duplicate-refund safeguards", () => {
  it("targets only the verified later August 1 charge and requires an explicit execution flag", async () => {
    const source = await readFile(
      new URL("../scripts/refund-daniel-pina-duplicate.ts", import.meta.url),
      "utf8",
    );

    expect(source).toContain('const ORIGINAL_TRANSACTION_ID = "d9n189v0i477l3n78r7g"');
    expect(source).toContain('const REFUND_AMOUNT_CENTS = 14_900');
    expect(source).toContain('const APPROVAL_FLAG = "EXECUTE_APPROVED_DANIEL_PINA_DUPLICATE_REFUND"');
    expect(source).toContain('timestamp.startsWith("2026-08-01T15:43")');
    expect(source).toContain('messageSent: false');
    expect(source).not.toContain("/api/recurring/subscription");
  });
});
