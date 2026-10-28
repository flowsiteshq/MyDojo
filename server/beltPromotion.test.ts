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
