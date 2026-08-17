import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const checkoutCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());
const selectedRows = vi.hoisted(() => ({ queue: [] as any[] }));

vi.mock("./stripeHelper", () => ({
  getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }),
  getOrCreateStripeCustomer,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => {
      const rows = selectedRows.queue.shift() ?? [];
      return Object.assign(Promise.resolve(rows), { limit: async () => rows });
    } }) }),
    insert: () => ({ values: async () => ({ insertId: 765432 }) }),
  }),
}));

import { appRouter } from "./routers";

const testPackage = {
  id: 1,
  name: "Foundation",
  isActive: 1,
  invitationOnly: 0,
  monthlyPrice: "149.00",
  downPayment: "248.00",
  enrollmentFee: "99.00",
  totalPrice: "2339.00",
  durationMonths: 12,
};

describe("Back-to-School $1 enrollment offer", () => {
  beforeEach(() => {
    checkoutCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    selectedRows.queue = [[testPackage]];
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_back_to_school" });
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_back_to_school" });
  });

  it("charges exactly $1 today, saves the payment method, and schedules Basic tuition 14 days later", async () => {
    const before = Date.now();
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createBackToSchoolCheckout({
      plan: "basic",
      customerName: "Back To School Parent",
      customerEmail: "back-to-school@example.com",
      customerPhone: "2815550101",
      studentName: "Back To School Student",
      termsAccepted: true,
    });

    expect(result).toMatchObject({ amountCents: 100, monthlyTuition: 149, enrollmentId: 765432 });
    const billingStart = new Date(result.billingStartsAt).getTime();
    expect(billingStart).toBeGreaterThanOrEqual(before + 14 * 24 * 60 * 60 * 1000 - 1000);
    expect(billingStart).toBeLessThanOrEqual(Date.now() + 14 * 24 * 60 * 60 * 1000 + 1000);
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      allow_promotion_codes: false,
      line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 100 }) })],
      payment_intent_data: expect.objectContaining({ setup_future_usage: "off_session" }),
      metadata: expect.objectContaining({ backToSchool: "true", firstMonthPrepaid: "false" }),
    }));
  });

  it("keeps the customer-facing offer page free of a public waiver code", () => {
    const offerPage = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/BackToSchool.tsx"), "utf8");
    expect(offerPage).not.toContain("WAIVE99");
    expect(offerPage).toContain("No $99 enrollment fee is charged with this special.");
  });
});
