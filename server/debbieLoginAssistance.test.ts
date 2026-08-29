import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/send-debbie-login-assistance.mjs"), "utf8");

describe("Debbie login-assistance sender", () => {
  it("uses the approved recipient, login route, and duplicate-send guard", () => {
    expect(source).toContain("+12812369283");
    expect(source).toContain("https://www.mydojoma.com/login");
    expect(source).toContain("Forgot password?");
    expect(source).toContain("skipped_duplicate");
    expect(source).toContain("sendProactiveSms");
  });
});
