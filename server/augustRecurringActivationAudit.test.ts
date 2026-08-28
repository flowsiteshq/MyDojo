import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/audit-august-recurring-activation.mjs"),
  "utf8",
);

describe("August recurring activation audit", () => {
  it("is read-only and reviews only paid August enrollment records", () => {
    expect(source).toContain("e.createdAt >= '2026-08-01 00:00:00'");
    expect(source).toContain("e.createdAt < '2026-09-01 00:00:00'");
    expect(source).toContain("stripe.paymentIntents.retrieve");
    expect(source).not.toContain("UPDATE enrollments");
    expect(source).not.toContain("stripe.subscriptions.create");
  });

  it("detects checkout metadata that cannot activate the stored enrollment", () => {
    expect(source).toContain("checkoutMetadataEnrollmentReference");
    expect(source).toContain("metadataReferencesEnrollment");
    expect(source).toContain("checkout_metadata_did_not_reference_this_enrollment");
    expect(source).toContain("stored_payment_reference_not_found_in_live_payment_account");
  });
});
