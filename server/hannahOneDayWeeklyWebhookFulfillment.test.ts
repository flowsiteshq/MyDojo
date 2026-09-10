import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/prepare-hannah-one-day-weekly-webhook-fulfillment.ts"),
  "utf8",
);
const inspectionSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/inspect-hannah-one-day-weekly-checkout-status.ts"),
  "utf8",
);

describe("scheduled student webhook fulfillment preparation", () => {
  it("uses a private non-public $74 monthly package with the approved $173 due today", () => {
    expect(source).toContain('const MONTHLY_TUITION = "74.00"');
    expect(source).toContain('const DOWN_PAYMENT = "173.00"');
    expect(source).toContain('const ENROLLMENT_FEE = "99.00"');
    expect(source).toContain("invitationOnly, isActive)\n         VALUES (?, 12");
    expect(source).toContain("1, 0)");
  });

  it("updates only the open unpaid checkout session with generic enrollment metadata", () => {
    expect(source).toContain('session.status !== "open"');
    expect(source).toContain('session.payment_status !== "unpaid"');
    expect(source).toContain("stripe.checkout.sessions.update");
    expect(source).toContain("packageId: String(packageId)");
    expect(source).toContain("customerName: PARENT_NAME");
    expect(source).toContain("studentName: STUDENT_NAME");
    expect(source).toContain("delete metadata.type");
  });

  it("requires explicit approval and stops on incompatible package or session state", () => {
    expect(source).toContain("EXECUTE_APPROVED_HANNAH_ONE_DAY_WEBHOOK_PREP");
    expect(source).toContain("Existing private one-day-per-week package does not match");
    expect(source).toContain("Scheduled-student Checkout session is no longer open");
  });

  it("supports a read-only post-send checkout status inspection", () => {
    expect(inspectionSource).toContain("read-only scheduled-student Checkout status inspection");
    expect(inspectionSource).toContain("sessionStatus");
    expect(inspectionSource).toContain("paymentStatus");
    expect(inspectionSource).toContain("subscriptionId");
    expect(inspectionSource).toContain("defaultPaymentMethod");
    expect(inspectionSource).toContain("existingEnrollment");
    expect(inspectionSource).toContain("privatePackage");
    expect(inspectionSource).not.toContain("checkout.sessions.create");
  });
});
