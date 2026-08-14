import { beforeEach, describe, expect, it, vi } from "vitest";

const paymentIntentCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());

vi.mock("./stripeHelper", () => ({
  getStripe: () => ({ paymentIntents: { create: paymentIntentCreate } }),
  getOrCreateStripeCustomer,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: 1, isActive: 1, enrollmentFee: "0.00", downPayment: "149.00", monthlyPrice: "149.00", name: "Foundation Program" }],
        }),
      }),
    }),
  }),
}));

import { appRouter } from "./routers";

describe("recurring membership payment authorization", () => {
  beforeEach(() => {
    paymentIntentCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_membership_test" });
    paymentIntentCreate.mockResolvedValue({ id: "pi_membership_test", client_secret: "pi_membership_secret" });
  });

  it("creates a Stripe PaymentIntent authorized for future off-session membership billing", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.member.createStripeEnrollmentPayment({
      packageId: 1,
      customerName: "Test Parent",
      customerEmail: "test-parent@example.com",
      customerPhone: "2815550101",
      studentName: "Test Student",
      agreementSignature: "Test Parent",
      agreementSignedAt: "2026-08-14T15:00:00.000Z",
      agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });
    expect(result).toMatchObject({ paymentIntentId: "pi_membership_test", clientSecret: "pi_membership_secret", amountCents: 14900 });
    expect(paymentIntentCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 14900,
      customer: "cus_membership_test",
      setup_future_usage: "off_session",
      automatic_payment_methods: { enabled: true },
      metadata: expect.objectContaining({ type: "membership_enrollment", packageId: "1" }),
    }));
  });
});
