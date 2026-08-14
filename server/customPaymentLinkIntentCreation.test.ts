import { beforeEach, describe, expect, it, vi } from "vitest";

const createPaymentIntent = vi.hoisted(() => vi.fn());
const createSetupIntent = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());
const link = vi.hoisted(() => ({
  id: 77,
  token: "custom-link-token",
  type: "one_time",
  title: "Tuition Catch-Up",
  amount: "149.00",
  isActive: 1,
  expiresAt: null,
  downPayment: null,
  billingInterval: null,
}));

vi.mock("./stripeHelper", () => ({
  createPaymentIntent,
  createSetupIntent,
  getOrCreateStripeCustomer,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: async () => [link] }) }),
  }),
}));

import { appRouter } from "./routers";

describe("custom payment link secure intent creation", () => {
  beforeEach(() => {
    createPaymentIntent.mockReset();
    createSetupIntent.mockReset();
    getOrCreateStripeCustomer.mockReset();
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_custom_test" });
    createPaymentIntent.mockResolvedValue({ clientSecret: "pi_secret", paymentIntentId: "pi_custom_test" });
    createSetupIntent.mockResolvedValue({ clientSecret: "seti_secret", setupIntentId: "seti_custom_test" });
    Object.assign(link, { type: "one_time", billingInterval: null });
  });

  it("creates a Stripe PaymentIntent for a one-time custom link without accepting a tokenized card", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.customPayments.createStripeIntent({
      token: "custom-link-token",
      customerName: "Test Parent",
      customerEmail: "test-parent@example.com",
      customerPhone: "2815550101",
    });
    expect(result).toMatchObject({ mode: "payment", paymentIntentId: "pi_custom_test", stripeCustomerId: "cus_custom_test" });
    expect(createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 14900, customerId: "cus_custom_test" }));
  });

  it("creates a Stripe SetupIntent for a recurring custom link before subscription creation", async () => {
    Object.assign(link, { type: "recurring", billingInterval: "monthly" });
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.customPayments.createStripeIntent({
      token: "custom-link-token",
      customerName: "Test Parent",
      customerEmail: "test-parent@example.com",
      customerPhone: "2815550101",
    });
    expect(result).toMatchObject({ mode: "setup", setupIntentId: "seti_custom_test", stripeCustomerId: "cus_custom_test" });
    expect(createSetupIntent).toHaveBeenCalledWith(expect.objectContaining({ customerId: "cus_custom_test" }));
  });
});
