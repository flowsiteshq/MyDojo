import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.hoisted(() => vi.fn());
const retrievePaymentIntent = vi.hoisted(() => vi.fn());
const retrievePaymentMethod = vi.hoisted(() => vi.fn());
const updateCustomer = vi.hoisted(() => vi.fn());
const createSubscription = vi.hoisted(() => vi.fn());
const updateValues = vi.hoisted(() => vi.fn());
const selectedRows = vi.hoisted(() => ({ queue: [] as any[] }));

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = { constructEvent };
    paymentIntents = { retrieve: retrievePaymentIntent };
    paymentMethods = { retrieve: retrievePaymentMethod };
    customers = { update: updateCustomer };
    prices = { create: vi.fn() };
    subscriptions = { create: createSubscription };
  },
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => selectedRows.queue.shift() ?? [] }) }) }),
    update: () => ({ set: (values: any) => { updateValues(values); return { where: async () => undefined }; } }),
  }),
}));

vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));

import { handleStripeWebhook } from "./stripeWebhook";

describe("hosted enrollment checkout webhook fulfillment", () => {
  beforeEach(() => {
    constructEvent.mockReset();
    retrievePaymentIntent.mockReset();
    retrievePaymentMethod.mockReset();
    updateCustomer.mockReset();
    createSubscription.mockReset();
    updateValues.mockReset();
    selectedRows.queue = [
      [{ id: 900001, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_hosted", membershipPackageId: 1 }],
      [{ id: 1, name: "Foundation", monthlyPrice: "149.00", stripePriceId: "price_foundation", totalPrice: "2339.00", durationMonths: 12 }],
    ];
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: {
        metadata: { type: "membership_enrollment_checkout", enrollmentId: "900001" },
        payment_intent: "pi_hosted",
        amount_total: 24800,
      } },
    });
    retrievePaymentIntent.mockResolvedValue({ status: "succeeded", customer: "cus_hosted", payment_method: "pm_hosted" });
    retrievePaymentMethod.mockResolvedValue({ id: "pm_hosted", type: "card", card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030, wallet: null } });
    updateCustomer.mockResolvedValue({});
    createSubscription.mockResolvedValue({ id: "sub_hosted" });
  });

  it("activates only the pending signed enrollment after its $149 first-month plus $99 fee checkout succeeds", async () => {
    const response = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
    await handleStripeWebhook({ headers: { "stripe-signature": "sig" }, body: Buffer.from("payload") } as any, response as any);

    expect(createSubscription).toHaveBeenCalledWith(expect.objectContaining({
      customer: "cus_hosted",
      items: [{ price: "price_foundation" }],
      default_payment_method: "pm_hosted",
    }));
    expect(updateValues).toHaveBeenCalledWith(expect.objectContaining({
      status: "active",
      stripePaymentIntentId: "pi_hosted",
      stripeSubscriptionId: "sub_hosted",
      downPaymentAmount: "248.00",
    }));
    expect(response.json).toHaveBeenCalledWith({ received: true });
  });
});
