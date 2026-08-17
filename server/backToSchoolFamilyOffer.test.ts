import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const webhookSource = fs.readFileSync(path.resolve(import.meta.dirname, "stripeWebhook.ts"), "utf8");
const pageSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/BackToSchool.tsx"), "utf8");

describe("Back-to-School family enrollment", () => {
  it("allows two or three selected plans in one $1 checkout and carries a fixed 14-day billing start", () => {
    expect(routerSource).toContain("createBackToSchoolFamilyCheckout: publicProcedure");
    expect(routerSource).toContain(".min(2).max(3)");
    expect(routerSource).toContain("unit_amount: 100");
    expect(routerSource).toContain('backToSchool: "true"');
    expect(routerSource).toContain('firstMonthPrepaid: "false"');
    expect(routerSource).toContain("billingStartAt: billingStartsAt.toISOString()");
    expect(routerSource).toContain("calculateFamilyRecurringTuition");
  });

  it("preserves the family offer’s 14-day start and no-prepaid-first-month flag during webhook fulfillment", () => {
    expect(webhookSource).toContain("...session.metadata");
    expect(webhookSource).toContain('firstMonthPrepaid === "false"');
    expect(webhookSource).toContain("trial_end: Math.floor(tuitionStartDate.getTime() / 1000)");
  });

  it("shows add-member controls, a single $1 initial charge, and 50% recurring rates for the second and third members", () => {
    expect(pageSource).toContain("members.length < 3");
    expect(pageSource).toContain("Add another family member");
    expect(pageSource).toContain("Due today for the whole family");
    expect(pageSource).toContain("$1.00");
    expect(pageSource).toContain("second and third family members receive 50% off");
    expect(pageSource).not.toContain("WAIVE99");
  });
});
