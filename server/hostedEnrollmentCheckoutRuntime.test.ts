import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());
const storagePut = vi.hoisted(() => vi.fn());
const renderEnrollmentAgreementPdf = vi.hoisted(() => vi.fn());

vi.mock("./stripeHelper", () => ({
  getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }),
  getOrCreateStripeCustomer,
}));

vi.mock("./storage", () => ({ storagePut }));
vi.mock("./enrollmentAgreementPdf", () => ({
  getEnrollmentAgreementVersion: () => "v-test",
  renderEnrollmentAgreementPdf,
}));

const testPackage = {
  id: 1,
  name: "Foundation",
  isActive: 1,
  invitationOnly: 0,
  monthlyPrice: "149.00",
  downPayment: "149.00",
  enrollmentFee: "149.00",
  totalPrice: "2339.00",
  durationMonths: 12,
};

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [testPackage] }) }) }),
    insert: () => ({ values: async () => ({ insertId: 900001 }) }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}));

import { appRouter } from "./routers";

describe("hosted enrollment checkout runtime", () => {
  beforeEach(() => {
    checkoutCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    storagePut.mockReset();
    renderEnrollmentAgreementPdf.mockReset();
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_hosted_test" });
    storagePut.mockResolvedValue({ url: "https://storage.example.test/agreement" });
    renderEnrollmentAgreementPdf.mockResolvedValue(Buffer.from("pdf"));
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_hosted_test" });
  });

  it("charges the true due-today amount and saves the payment method for later recurring billing", async () => {
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.member.createStripeEnrollmentCheckout({
      packageId: 1,
      customerName: "Test Parent",
      customerEmail: "test-parent@example.com",
      customerPhone: "2815550101",
      studentName: "Test Student",
      agreementSignature: "Test Parent",
      agreementSignedAt: "2026-08-14T21:00:00.000Z",
      agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });

    expect(result).toMatchObject({
      checkoutUrl: "https://checkout.stripe.com/c/pay/cs_hosted_test",
      enrollmentId: 900001,
      amountCents: 14900,
    });
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer: "cus_hosted_test",
      payment_intent_data: expect.objectContaining({ setup_future_usage: "off_session" }),
      line_items: [expect.objectContaining({
        price_data: expect.objectContaining({ unit_amount: 14900 }),
      })],
    }));
  });
});
