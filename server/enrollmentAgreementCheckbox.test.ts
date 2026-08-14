import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const agreementSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/components/EnrollmentAgreement.tsx"),
  "utf8",
);

describe("enrollment agreement acknowledgement", () => {
  it("uses the checkbox as the only acknowledgement state transition", () => {
    const checkboxSection = agreementSource.slice(
      agreementSource.indexOf("{/* Checkbox */}"),
      agreementSource.indexOf("{/* Proceed button */}"),
    );

    expect(checkboxSection).toContain("onCheckedChange={(v) => setAccepted(!!v)}");
    expect(checkboxSection).not.toContain("onClick={() => setAccepted((a) => !a)}");
  });

  it("requires acknowledgement together with name and handwritten signature before payment can proceed", () => {
    expect(agreementSource).toContain("const canProceed = allSectionsRead && nameMatches && accepted && Boolean(signatureDataUrl);");
    expect(agreementSource).toContain("disabled={!canProceed}");
  });
});
