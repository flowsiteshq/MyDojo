import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());
const selectedRows = vi.hoisted(() => ({ queue: [] as any[] }));
const insertResults = vi.hoisted(() => ({ queue: [] as any[] }));

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
    insert: () => ({ values: async () => insertResults.queue.shift() ?? { insertId: 0 } }),
  }),
}));

import { appRouter } from "./routers";

const foundation = { id: 1, name: "Foundation", isActive: 1, invitationOnly: 0, monthlyPrice: "149.00", downPayment: "248.00", enrollmentFee: "99.00", totalPrice: "2339.00", durationMonths: 12 };
const blackBelt = { id: 2, name: "Black Belt", isActive: 1, invitationOnly: 0, monthlyPrice: "199.00", downPayment: "298.00", enrollmentFee: "99.00", totalPrice: "3111.00", durationMonths: 12 };

describe("Back-to-School family checkout runtime", () => {
  beforeEach(() => {
    checkoutCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    selectedRows.queue = [[], [{ id: 77 }], [], [foundation], [blackBelt]];
    insertResults.queue = [{ insertId: 77 }, { insertId: 500001 }, { insertId: 500002 }];
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_back_to_school_family" });
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_back_to_school_family" });
  });

  it("charges one dollar once and schedules the first and second members at their correct 14-day recurring amounts", async () => {
    const before = Date.now();
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createBackToSchoolFamilyCheckout({
      customerName: "Family Parent",
      customerEmail: "family-offer@example.com",
      customerPhone: "2815550101",
      members: [
        { studentName: "Student One", plan: "basic" },
        { studentName: "Student Two", plan: "black_belt" },
      ],
      termsAccepted: true,
    });

    expect(result).toMatchObject({ amountCents: 100, members: [
      { studentName: "Student One", monthlyTuition: 149, hasFamilyDiscount: false },
      { studentName: "Student Two", monthlyTuition: 99.5, hasFamilyDiscount: true },
    ] });
    expect(new Date(result.billingStartsAt).getTime()).toBeGreaterThanOrEqual(before + 14 * 24 * 60 * 60 * 1000 - 1000);
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 100 }) })],
      payment_intent_data: expect.objectContaining({ setup_future_usage: "off_session" }),
      metadata: expect.objectContaining({
        type: "family_membership_enrollment_checkout",
        enrollmentIds: "500001,500002",
        recurringMonthlyAmounts: "149.00,99.50",
        backToSchool: "true",
        firstMonthPrepaid: "false",
      }),
      allow_promotion_codes: false,
    }));
  });
});
