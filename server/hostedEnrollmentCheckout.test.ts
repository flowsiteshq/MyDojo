import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const paymentFormSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/components/FluidPayEnrollmentForm.tsx"), "utf8");
const webhookSource = fs.readFileSync(path.resolve(import.meta.dirname, "stripeWebhook.ts"), "utf8");

describe("hosted enrollment checkout", () => {
  it("preserves a signed agreement in a pending enrollment before redirecting to a monthly hosted checkout", () => {
    expect(routerSource).toContain("createStripeEnrollmentCheckout: publicProcedure");
    expect(routerSource).toContain('status: "pending"');
    expect(routerSource).toContain("agreementSignatureDataUrl");
    expect(routerSource).toContain('mode: "payment"');
    expect(routerSource).toContain('unit_amount: Math.round(dueToday * 100)');
    expect(routerSource).toContain('setup_future_usage: "off_session"');
    expect(routerSource).toContain('type: "membership_enrollment_checkout"');
  });

  it("gives signed enrollment a clear secure checkout action instead of rendering the incompatible embedded payment panel", () => {
    expect(paymentFormSource).toContain("createStripeCheckoutMutation");
    expect(paymentFormSource).toContain("Continue to Secure Checkout");
    expect(paymentFormSource).not.toContain("<StripePaymentForm");
  });

  it("activates the matching pending enrollment only after hosted checkout completion", () => {
    expect(webhookSource).toContain('session.metadata?.type === "membership_enrollment_checkout"');
    expect(webhookSource).toContain("handleHostedMembershipEnrollment(session)");
    expect(webhookSource).toContain('status: "active"');
    expect(webhookSource).toContain("stripeSubscriptionId: subscription.id");
    expect(webhookSource).toContain("trial_end: Math.floor(nextBillingDate.getTime() / 1000)");
  });
});
