import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeCheckoutCreate = vi.hoisted(() => vi.fn());
const insertValues = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { create: stripeCheckoutCreate } };
  },
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    insert: () => ({ values: insertValues }),
  }),
}));

import { appRouter } from "./routers";

describe("paid belt test and event Checkout creation", () => {
  beforeEach(() => {
    insertValues.mockReset();
    stripeCheckoutCreate.mockReset();
    insertValues.mockResolvedValue([{ insertId: 101 }]);
    stripeCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.test/session/paid-flow" });
    process.env.STRIPE_SECRET_KEY = "sk_test_paid_checkout";
  });

  it("creates a Stripe Checkout session for a paid belt-test intent without charging during creation", async () => {
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.beltTestIntent.submit({
      studentName: "Test Student",
      parentName: "Test Parent",
      phone: "2815550101",
      email: "test-parent@example.com",
      currentBelt: "White Belt",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/paid-flow");
    expect(stripeCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "test-parent@example.com",
      metadata: expect.objectContaining({ type: "belt_test_intent", intent_id: "101" }),
    }));
  });

  it("creates a Stripe Checkout session for a paid event registration without charging during creation", async () => {
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://mydojoma.com" } } } as any);
    const result = await caller.eventReg.register({
      eventId: "master-yaeger-seminar",
      name: "Test Parent",
      phone: "2815550101",
      email: "test-parent@example.com",
      amountCents: 2900,
      attendeeCount: 1,
      eventName: "Master Yaeger Seminar",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/paid-flow");
    expect(stripeCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "test-parent@example.com",
      metadata: expect.objectContaining({ type: "event_registration", registration_id: "101" }),
    }));
  });
});
