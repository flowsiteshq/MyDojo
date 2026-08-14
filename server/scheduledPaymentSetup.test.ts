import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());

vi.mock("./stripeHelper", () => ({
  getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }),
  getOrCreateStripeCustomer,
}));

import { scheduledPaymentsRouter } from "./scheduledPaymentsRouter";

describe("scheduled payment secure setup", () => {
  beforeEach(() => {
    checkoutCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_scheduled_test" });
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.test/session/setup-123" });
  });

  it("creates a hosted Stripe setup session without collecting or charging a card in MyDojo", async () => {
    const caller = scheduledPaymentsRouter.createCaller({ user: { id: 12, role: "admin" } } as any);
    const result = await caller.createSetupCheckout({
      customerName: "Test Parent",
      customerEmail: "test-parent@example.com",
      customerPhone: "2815550101",
      amount: 149,
      description: "Monthly tuition",
      scheduledDate: "2026-09-01",
      origin: "https://mydojoma.com",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/setup-123");
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "setup",
      customer: "cus_scheduled_test",
      metadata: expect.objectContaining({ type: "scheduled_payment_setup", amount: "149.00" }),
    }));
  });
});
