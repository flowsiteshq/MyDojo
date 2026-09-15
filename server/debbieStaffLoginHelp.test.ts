import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/send-debbie-staff-login-help.ts"),
  "utf8",
);

describe("Debbie staff-login help SMS", () => {
  it("locks sending behind explicit approval and protects against duplicate delivery", () => {
    expect(source).toContain('DEBBIE_LOGIN_HELP_APPROVED !== "send"');
    expect(source).toContain("the staff portal text was already recorded");
    expect(source).toContain("contact is opted out of SMS");
  });

  it("uses Debbie’s verified staff portal and omits password-reset wording", () => {
    expect(source).toContain("https://www.mydojoma.com/admin/login");
    expect(source).toContain("debbie@debbiegregory.com");
    expect(source).toContain("If it still will not let you in, reply here");
    expect(source).toContain("must not use password-reset wording");
    expect(source).toContain("staff account and mobile do not match");
  });
});
