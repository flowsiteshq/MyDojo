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

describe("family enrollment checkout", () => {
  beforeEach(() => {
    selectedRows.queue = [
      [{ id: 1, name: "Foundation", isActive: 1, invitationOnly: 0, monthlyPrice: "149.00", downPayment: "248.00", enrollmentFee: "99.00", totalPrice: "2339.00", durationMonths: 12 }],
      [{ id: 2, name: "Black Belt", isActive: 1, invitationOnly: 0, monthlyPrice: "199.00", downPayment: "298.00", enrollmentFee: "99.00", totalPrice: "8700.00", durationMonths: 36 }],
      [],
      [{ id: 44, primaryContactEmail: "family@example.com", registrationFeePaid: 1 }],
      [],
    ];
    inserted.count = 0;
    checkoutCreate.mockReset(); getOrCreateStripeCustomer.mockReset(); storagePut.mockReset(); renderEnrollmentAgreementPdf.mockReset();
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_family_checkout" });
    storagePut.mockResolvedValue({ url: "https://storage.example.test/agreement" });
    renderEnrollmentAgreementPdf.mockResolvedValue(Buffer.from("pdf"));
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_family_enroll" });
  });

  it("collects all initial charges together and sets the second member to half-price recurring tuition", async () => {
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createFamilyEnrollmentCheckout({
      customerName: "Family Parent",
      customerEmail: "family@example.com",
      customerPhone: "2815550101",
      members: [{ packageId: 1, studentName: "First Student" }, { packageId: 2, studentName: "Second Student" }],
      agreementSignature: "Family Parent",
      agreementSignedAt: "2026-08-14T21:00:00.000Z",
      agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });

    expect(result).toMatchObject({ totalDueToday: 546, members: [
      { studentName: "First Student", memberOrder: 1, hasDiscount: false, recurringMonthlyAmount: 149 },
      { studentName: "Second Student", memberOrder: 2, hasDiscount: true, recurringMonthlyAmount: 99.5 },
    ] });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      line_items: [
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 24800 }) }),
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 29800 }) }),
      ],
      metadata: expect.objectContaining({ familyGroupId: "44", memberOrders: "1,2", recurringMonthlyAmounts: "149.00,99.50" }),
    }));
  });

  it("enrolls a third family member in the same checkout and applies the half-price recurring rate", async () => {
    selectedRows.queue = [
      [{ id: 1, name: "Foundation", isActive: 1, invitationOnly: 0, monthlyPrice: "149.00", downPayment: "248.00", enrollmentFee: "99.00", totalPrice: "2339.00", durationMonths: 12 }],
      [{ id: 30001, name: "Plus", isActive: 1, invitationOnly: 0, monthlyPrice: "99.00", downPayment: "198.00", enrollmentFee: "99.00", totalPrice: "1287.00", durationMonths: 12 }],
      [{ id: 2, name: "Black Belt", isActive: 1, invitationOnly: 0, monthlyPrice: "199.00", downPayment: "298.00", enrollmentFee: "99.00", totalPrice: "8700.00", durationMonths: 36 }],
      [],
      [{ id: 55, primaryContactEmail: "three@example.com", registrationFeePaid: 1 }],
      [],
    ];
    inserted.count = 0;
    checkoutCreate.mockClear();
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createFamilyEnrollmentCheckout({
      customerName: "Three Parent",
      customerEmail: "three@example.com",
      customerPhone: "2815550102",
      members: [
        { packageId: 1, studentName: "First Student" },
        { packageId: 30001, studentName: "Second Student" },
        { packageId: 2, studentName: "Third Student" },
      ],
      agreementSignature: "Three Parent",
      agreementSignedAt: "2026-08-14T21:00:00.000Z",
      agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });

    expect(result).toMatchObject({ totalDueToday: 744, members: [
      { memberOrder: 1, hasDiscount: false, recurringMonthlyAmount: 149 },
      { memberOrder: 2, hasDiscount: true, recurringMonthlyAmount: 49.5 },
      { memberOrder: 3, hasDiscount: true, recurringMonthlyAmount: 99.5 },
    ] });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 24800 }) }),
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 19800 }) }),
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 29800 }) }),
      ],
      metadata: expect.objectContaining({ familyGroupId: "55", memberOrders: "1,2,3", recurringMonthlyAmounts: "149.00,49.50,99.50" }),
    }));
  });
});
