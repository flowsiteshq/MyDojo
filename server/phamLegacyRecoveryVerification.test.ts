import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const verificationScriptPath = path.resolve(testDirectory, "../scripts/verify-pham-legacy-recovery.mjs");

describe("Pham legacy recovery verification", () => {
  it("uses only read-only lookup endpoints for the known subscription and payment", () => {
    const source = fs.readFileSync(verificationScriptPath, "utf8");

    expect(source).toContain('method: "GET"');
    expect(source).toContain("/api/recurring/subscription/${subscriptionId}");
    expect(source).toContain("/api/transaction/${transactionId}");
    expect(source).toContain("auditOnly: true");
    expect(source).not.toContain('method: "POST"');
    expect(source).not.toContain('method: "DELETE"');
  });
});
