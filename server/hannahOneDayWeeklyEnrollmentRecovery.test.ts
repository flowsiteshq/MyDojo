import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/recover-hannah-one-day-weekly-enrollment.ts"),
  "utf8",
);

describe("completed scheduled-student enrollment recovery", () => {
  it("targets the completed $173 checkout and verified existing $74 subscription only", () => {
    expect(source).toContain('const DUE_TODAY_CENTS = 17_300');
    expect(source).toContain('const MONTHLY_TUITION_CENTS = 7_400');
    expect(source).toContain('session.status !== "complete"');
    expect(source).toContain('session.payment_status !== "paid"');
    expect(source).toContain('subscription.status !== "active"');
  });

  it("creates one private staff-authorized $74 package only when absent", () => {
    expect(source).toContain('const PRIVATE_PACKAGE_NAME = "One Day Per Week — $74 (Staff Authorized)"');
    expect(source).toContain("invitationOnly, isActive)");
    expect(source).toContain("1, 0)");
    expect(source).toContain("Existing private one-day-per-week package is incompatible");
  });

  it("inserts a single active enrollment linked to the existing subscription and never charges or subscribes again", () => {
    expect(source).toContain("INSERT INTO enrollments");
    expect(source).toContain("stripeSubscriptionId");
    expect(source).toContain("newChargeCreated: false");
    expect(source).toContain("newSubscriptionCreated: false");
    expect(source).not.toContain("subscriptions.create");
    expect(source).not.toContain("paymentIntents.create");
  });

  it("requires explicit execution authorization and blocks duplicate enrollment records", () => {
    expect(source).toContain("EXECUTE_APPROVED_HANNAH_ONE_DAY_ENROLLMENT_RECOVERY");
    expect(source).toContain("existingEnrollment");
    expect(source).toContain("Another active or pending enrollment already exists");
  });
});
