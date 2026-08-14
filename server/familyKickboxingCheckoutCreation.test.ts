import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());
const priceCreate = vi.hoisted(() => vi.fn());
const getOrCreateStripeCustomer = vi.hoisted(() => vi.fn());

vi.mock("./stripeHelper", () => ({
  getStripe: () => ({
    prices: { create: priceCreate },
    checkout: { sessions: { create: checkoutCreate } },
  }),
  getOrCreateStripeCustomer,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 55 }] }) }) }),
  }),
}));

import { appRouter } from "./routers";

describe("family kickboxing hosted subscription checkout", () => {
  beforeEach(() => {
    checkoutCreate.mockReset();
    priceCreate.mockReset();
    getOrCreateStripeCustomer.mockReset();
    getOrCreateStripeCustomer.mockResolvedValue({ id: "cus_kickboxing_test" });
    priceCreate.mockResolvedValue({ id: "price_kickboxing_test" });
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.test/session/kickboxing-123" });
  });

  it("creates a Stripe subscription checkout session and does not collect a card in the portal", async () => {
    const caller = appRouter.createCaller({
      req: { headers: {} },
      user: { id: 44, email: "test-parent@example.com", name: "Test Parent", role: "user" },
    } as any);
    const result = await caller.family.createFamilyKickboxingCheckout({
      memberName: "Test Student",
      memberEmail: "test-parent@example.com",
      memberPhone: "2815550101",
      origin: "https://mydojoma.com",
    });
    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/kickboxing-123");
    expect(priceCreate).toHaveBeenCalledWith(expect.objectContaining({ recurring: { interval: "month" } }));
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "subscription",
      customer: "cus_kickboxing_test",
      metadata: expect.objectContaining({ type: "family_kickboxing_addon", familyGroupId: "55" }),
    }));
  });
});
