import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/retry-parents-night-out-sports-night-2026-08-28-failures.mjs"), "utf8");

describe("Parents’ Night Out retry suspension", () => {
  it("fails closed until a future user-approved retry is explicitly resumed", () => {
    expect(source).toContain('const resumeApproved = process.argv.includes("--resume-approved")');
    expect(source).toContain("if (!resumeApproved)");
    expect(source).toContain("retry is suspended");
  });
});
