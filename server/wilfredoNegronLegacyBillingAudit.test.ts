import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-wilfredo-negron-legacy-billing.mjs"),
  "utf8"
);

describe("Wilfredo Negron legacy billing audit", () => {
  it("is limited to subscription retrieval and transaction search", () => {
    expect(source).toContain('method: "POST"');
    expect(source).toContain("/api/transaction/search");
    expect(source).toContain("/api/recurring/subscription/");
    expect(source).not.toContain("/api/transaction\", {");
    expect(source).not.toContain("/api/recurring/subscription\", {");
    expect(source).not.toContain('method: "PUT"');
    expect(source).not.toContain('method: "DELETE"');
  });
});
