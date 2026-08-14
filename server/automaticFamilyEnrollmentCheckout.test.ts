import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());
const storagePut = vi.hoisted(() => vi.fn());
const renderEnrollmentAgreementPdf = vi.hoisted(() => vi.fn());
const selectedRows = vi.hoisted(() => ({ queue: [] as any[] }));

vi.mock("./stripeHelper", () => ({ getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }), getOrCreateStripeCustomer }));
vi.mock("./storage", () => ({ storagePut }));
vi.mock("./enrollmentAgreementPdf", () => ({ getEnrollmentAgreementVersion: () => "v-test", renderEnrollmentAgreementPdf }));
vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => {
      const rows = selectedRows.queue.shift() ?? [];
      return Object.assign(Promise.resolve(rows), { limit: async () => rows });
    } }) }),
    insert: () => ({ values: async () => ({ insertId: 900003 }) }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}));

import { appRouter } from "./routers";

describe("automatic family enrollment recurring price", () => {
  beforeEach(() => {
    selectedRows.queue = [
      [{ id: 1, name: "Foundation", isActive: 1, invitationOnly: 0, monthlyPrice: "149.00", downPayment: "248.00", enrollmentFee: "99.00", totalPrice: "2339.00", durationMonths: 12 }],
      [{ id: 44, primaryContactEmail: "family@example.com", registrationFeePaid: 1 }],
      [{ id: 10, enrollmentId: 700001, memberOrder: 1 }],
    ];
    checkoutCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    storagePut.mockReset();
    renderEnrollmentAgreementPdf.mockReset();
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_family_test" });
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_family_test" });
    storagePut.mockResolvedValue({ url: "https://storage.example.test/agreement" });
    renderEnrollmentAgreementPdf.mockResolvedValue(Buffer.from("pdf"));
  });

  it("charges first-month tuition plus the $99 fee and sets the second member's recurring tuition to 50%", async () => {
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createStripeEnrollmentCheckout({
      packageId: 1,
      customerName: "Family Parent",
      customerEmail: "family@example.com",
      customerPhone: "2815550101",
      agreementSignature: "Family Parent",
      agreementSignedAt: "2026-08-14T21:00:00.000Z",
      agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });

    expect(result).toMatchObject({ amountCents: 24800, familyMemberOrder: 2, recurringMonthlyAmount: 74.5, hasFamilyDiscount: true });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ familyGroupId: "44", familyMemberOrder: "2", recurringMonthlyAmount: "74.50", familyDiscount: "50_percent" }),
    }));
  });
});
