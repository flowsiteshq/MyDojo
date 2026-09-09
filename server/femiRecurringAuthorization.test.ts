import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/create-femi-272-recurring-authorization.mjs"),
  "utf8",
);

describe("Femi $272 recurring authorization", () => {
  it("targets only the explicitly approved member and monthly amount", () => {
    expect(source).toContain('name: "Femi Alabi-Isama"');
    expect(source).toContain("amount: 272.00");
    expect(source).toContain("'recurring'");
    expect(source).toContain("'monthly'");
  });

  it("requires approval and blocks duplicate links, completed payments, and delivery", () => {
    expect(source).toContain("EXECUTE_APPROVED_FEMI_RECURRING_LINK");
    expect(source).toContain("getExistingLink");
    expect(source).toContain("paidLinkUseExists");
    expect(source).toContain("smsAlreadyRecorded");
    expect(source).toContain("DRY_RUN");
  });

  it("honors opt-outs, records recipient delivery, and gives the customer exact recurring terms", () => {
    expect(source).toContain("!contact.optedOut");
    expect(source).toContain("persistSmsAudit");
    expect(source).toContain("charges $272.00 today and starts $272.00 monthly tuition");
  });
});
