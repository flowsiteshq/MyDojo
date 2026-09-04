import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const emailSource = fs.readFileSync(path.resolve(import.meta.dirname, "emailService.ts"), "utf8");
const scriptSource = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/send-debbie-staff-access-setup.ts"), "utf8");

describe("Debbie staff access setup", () => {
  it("uses direct staff-access wording and requires explicit send confirmation", () => {
    expect(emailSource).toContain("Set Up Your Staff Access");
    expect(emailSource).toContain("Set up your MyDojo staff access");
    expect(scriptSource).toContain('DEBBIE_STAFF_ACCESS_SETUP_CONFIRMED !== "yes"');
    expect(scriptSource).toContain("sendStaffAccessSetupEmail");
    expect(scriptSource).not.toContain("console.log(token)");
  });
});
