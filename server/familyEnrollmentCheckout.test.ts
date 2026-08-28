import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());
const storagePut = vi.hoisted(() => vi.fn());
const renderEnrollmentAgreementPdf = vi.hoisted(() => vi.fn());
const selectedRows = vi.hoisted(() => ({ queue: [] as any[] }));
const inserted = vi.hoisted(() => ({ count: 0 }));

vi.mock("./stripeHelper", () => ({ getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }), getOrCreateStripeCustomer }));
vi.mock("./storage", () => ({ storagePut }));
vi.mock("./enrollmentAgreementPdf", () => ({ getEnrollmentAgreementVersion: () => "v-test", renderEnrollmentAgreementPdf }));
vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => {
      const rows = selectedRows.queue.shift() ?? [];
      return Object.assign(Promise.resolve(rows), { limit: async () => rows });
    } }) }),
    insert: () => ({ values: async () => {
      inserted.count += 1;
      return { insertId: inserted.count === 1 ? 44 : 900000 + inserted.count };
    } }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}));

import { appRouter } from "./routers";

const foundation = { id: 1, name: "Foundation", isActive: 1, invitationOnly: 0, monthlyPrice: "149.00", downPayment: "248.00", enrollmentFee: "99.00", totalPrice: "2339.00", durationMonths: 12 };
const blackBelt = { id: 2, name: "Black Belt", isActive: 1, invitationOnly: 0, monthlyPrice: "199.00", downPayment: "298.00", enrollmentFee: "99.00", totalPrice: "8700.00", durationMonths: 36 };
const plus = { id: 30001, name: "Plus", isActive: 1, invitationOnly: 0, monthlyPrice: "99.00", downPayment: "198.00", enrollmentFee: "99.00", totalPrice: "1287.00", durationMonths: 12 };
const agreement = { agreementSignature: "Family Parent", agreementSignedAt: "2026-08-14T21:00:00.000Z", agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgo=" };

describe("family enrollment checkout", () => {
  beforeEach(() => {
    inserted.count = 0;
    checkoutCreate.mockReset(); getOrCreateStripeCustomer.mockReset(); storagePut.mockReset(); renderEnrollmentAgreementPdf.mockReset();
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_family_enroll" });
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_family_checkout" });
    storagePut.mockResolvedValue({ url: "https://storage.example.test/agreement" });
    renderEnrollmentAgreementPdf.mockResolvedValue(Buffer.from("pdf"));
  });

  it("discounts the second member's first month and recurring tuition by 50%", async () => {
    selectedRows.queue = [[foundation], [blackBelt], [], [{ id: 44, primaryContactEmail: "family@example.com", registrationFeePaid: 1 }], []];
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createFamilyEnrollmentCheckout({ customerName: "Family Parent", customerEmail: "family@example.com", customerPhone: "2815550101", members: [{ packageId: 1, studentName: "First Student" }, { packageId: 2, studentName: "Second Student" }], ...agreement });

    expect(result).toMatchObject({ totalDueToday: 446.5, members: [
      { studentName: "First Student", memberOrder: 1, hasDiscount: false, recurringMonthlyAmount: 149, dueToday: 248 },
      { studentName: "Second Student", memberOrder: 2, hasDiscount: true, recurringMonthlyAmount: 99.5, dueToday: 198.5 },
    ] });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 24800 }) }), expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 19850 }) })],
      metadata: expect.objectContaining({ familyGroupId: "44", memberOrders: "1,2", dueTodayAmounts: "248.00,198.50" }),
    }));
  });

  it("discounts the second and third members' first month and recurring tuition", async () => {
    selectedRows.queue = [[foundation], [plus], [blackBelt], [], [{ id: 55, primaryContactEmail: "three@example.com", registrationFeePaid: 1 }], []];
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createFamilyEnrollmentCheckout({ customerName: "Three Parent", customerEmail: "three@example.com", customerPhone: "2815550102", members: [{ packageId: 1, studentName: "First" }, { packageId: 30001, studentName: "Second" }, { packageId: 2, studentName: "Third" }], ...agreement });

    expect(result).toMatchObject({ totalDueToday: 595, members: [
      { memberOrder: 1, hasDiscount: false, recurringMonthlyAmount: 149, dueToday: 248 },
      { memberOrder: 2, hasDiscount: true, recurringMonthlyAmount: 49.5, dueToday: 148.5 },
      { memberOrder: 3, hasDiscount: true, recurringMonthlyAmount: 99.5, dueToday: 198.5 },
    ] });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 24800 }) }),
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 14850 }) }),
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 19850 }) }),
      ],
    }));
  });

  it("charges $298 today when WAIVE99 is used for three Foundation family members", async () => {
    selectedRows.queue = [
      [{ code: "WAIVE99", active: 1, discountType: "waive_down_payment", discountValue: "0", expiresAt: null, maxUses: null, usedCount: 0 }],
      [foundation], [foundation], [foundation], [], [{ id: 66, primaryContactEmail: "waive@example.com", registrationFeePaid: 1 }], [],
    ];
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createFamilyEnrollmentCheckout({ customerName: "Waive Parent", customerEmail: "waive@example.com", customerPhone: "2815550103", members: [{ packageId: 1, studentName: "One" }, { packageId: 1, studentName: "Two" }, { packageId: 1, studentName: "Three" }], promoCode: "WAIVE99", ...agreement });

    expect(result).toMatchObject({ totalDueToday: 298, members: [{ dueToday: 149 }, { dueToday: 74.5 }, { dueToday: 74.5 }] });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 14900 }) }),
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 7450 }) }),
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 7450 }) }),
      ],
      metadata: expect.objectContaining({ dueTodayAmounts: "149.00,74.50,74.50", promoCode: "WAIVE99" }),
    }));
  });
});
