import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());
const storagePut = vi.hoisted(() => vi.fn());
const renderEnrollmentAgreementPdf = vi.hoisted(() => vi.fn());
const selectedRows = vi.hoisted(() => ({ queue: [] as any[] }));

vi.mock("./stripeHelper", () => ({
  getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }),
  getOrCreateStripeCustomer,
}));
vi.mock("./storage", () => ({ storagePut }));
vi.mock("./enrollmentAgreementPdf", () => ({ getEnrollmentAgreementVersion: () => "v-test", renderEnrollmentAgreementPdf }));
vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => selectedRows.queue.shift() ?? [] }) }) }),
    insert: () => ({ values: async () => ({ insertId: 900002 }) }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}));

import { appRouter } from "./routers";

describe("down-payment waiver checkout", () => {
  beforeEach(() => {
    checkoutCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    storagePut.mockReset();
    renderEnrollmentAgreementPdf.mockReset();
    selectedRows.queue = [
      [{ id: 1, name: "Foundation", isActive: 1, invitationOnly: 0, monthlyPrice: "149.00", downPayment: "99.00", enrollmentFee: "99.00", totalPrice: "1887.00", durationMonths: 12 }],
      [{ id: 1, code: "WAIVE99", active: 1, expiresAt: null, maxUses: null, usedCount: 0, discountType: "waive_down_payment", discountValue: "99.00" }],
    ];
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_waive_test" });
    storagePut.mockResolvedValue({ url: "https://storage.example.test/agreement" });
    renderEnrollmentAgreementPdf.mockResolvedValue(Buffer.from("pdf"));
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_waive_test" });
  });

  it("waives the $99 down payment but opens setup checkout to save a payment method for recurring tuition", async () => {
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createStripeEnrollmentCheckout({
      packageId: 1,
      customerName: "Test Parent",
      customerEmail: "test-parent@example.com",
      customerPhone: "2815550101",
      agreementSignature: "Test Parent",
      agreementSignedAt: "2026-08-14T21:00:00.000Z",
      agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
      promoCode: "waive99",
    });

    expect(result).toMatchObject({ amountCents: 0, enrollmentId: 900002 });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "setup",
      customer: "cus_waive_test",
      setup_intent_data: expect.objectContaining({ metadata: expect.objectContaining({ type: "membership_enrollment_checkout" }) }),
    }));
  });
});
