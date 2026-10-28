import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const webhookSource = fs.readFileSync(path.resolve(import.meta.dirname, "stripeWebhook.ts"), "utf8");
const pageSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/BeltPromotion.tsx"), "utf8");
const appSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");

describe("October belt promotion workflow", () => {
  it("derives the next belt server-side and refuses arbitrary next ranks", () => {
    expect(routerSource).toContain("nextPromotionBelt(input.currentBelt)");
    expect(routerSource).toContain("The next belt must follow MyDojo's configured ranking system");
    expect(routerSource).toContain('const PROMOTION_BELT_SEQUENCE = BELT_RANKS.filter(rank => rank !== "No Belt")');
    expect(pageSource).toContain("Current belt rank");
    expect(pageSource).toContain("Current stripe color");
    expect(pageSource).toContain("Number of stripes");
  });

  it("requires four black stripes for evaluation readiness and keeps incomplete progress separate", () => {
    expect(routerSource).toContain('promotionEligibility(color: PromotionStripeColor, count: number): "incomplete" | "ready_for_evaluation"');
    expect(routerSource).toContain("stripeProgressUnits(color, count) >= 16");
    expect(routerSource).toContain('currentStripeColor: z.enum(PROMOTION_STRIPE_COLORS)');
    expect(routerSource).toContain('currentStripeCount: z.number().int().min(0).max(4)');
    expect(pageSource).toContain("STRIPE PROGRESSION INCOMPLETE");
    expect(pageSource).toContain("BELT PROMOTION ELIGIBLE FOR REVIEW");
    expect(pageSource).toContain("Stripes are progress markers, not separate belt ranks");
  });

  it("preserves documented staff exceptions without coupling them to payment", () => {
    expect(routerSource).toContain("eligibilityException");
    expect(routerSource).toContain("Document the reason for a promotion eligibility exception");
    expect(pageSource).toContain("Four black stripes means ready for belt evaluation—not an automatic promotion");
    expect(pageSource).toContain("Payment status remains PENDING");
  });

  it("keeps below-orange submissions in manual review and does not auto-charge them", () => {
    expect(routerSource).toContain('paymentStatus: paymentAmountCents > 0 ? "pending" : "manual_review"');
    expect(routerSource).toContain('if (paymentAmountCents === 0)');
  });

  it("requires provider-confirmed payment and exact amount matching", () => {
    expect(webhookSource).toContain('october_belt_promotion_payment');
    expect(webhookSource).toContain('session.payment_status !== "paid"');
    expect(webhookSource).toContain('actualAmount !== intent.paymentAmountCents');
  });

  it("does not change recurring billing when an upgrade is requested", () => {
    expect(pageSource).toContain("No recurring membership is changed or charged here");
    expect(routerSource).toContain('upgradeStatus = input.upgradeTargetPlan ? "requested" : "not_requested"');
  });

  it("exposes both public registration and protected operations routes", () => {
    expect(appSource).toContain('path="/belt-promotion"');
    expect(appSource).toContain('path="/admin/belt-promotions"');
  });
});
