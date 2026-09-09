import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-angelina-sodhi-overcharge.mjs"),
  "utf8",
);

describe("Angelina Sodhi membership overcharge audit", () => {
  it("targets only the verified historical customer and subscription references", () => {
    expect(source).toContain('const CUSTOMER_ID = "d8jkk7n0i474gftkbje0"');
    expect(source).toContain('const SUBSCRIPTION_ID = "d9lumh70i470fha31l80"');
    expect(source).toContain('const WINDOW_START = "2026-06-01"');
    expect(source).toContain('const WINDOW_END = "2026-10-01"');
  });

  it("is read-only and specifically flags duplicate August $149 paid transactions", () => {
    expect(source).toContain("augustPaid149Count");
    expect(source).toContain("refundableCandidateIds");
    expect(source).not.toMatch(/method:\s*["']POST["'][\s\S]*\/api\/transaction(?!\/search)/);
    expect(source).not.toContain("/refund");
    expect(source).not.toContain("/status/");
  });
});
