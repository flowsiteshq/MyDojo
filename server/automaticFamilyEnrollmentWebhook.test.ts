import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.hoisted(() => vi.fn());
const retrievePaymentIntent = vi.hoisted(() => vi.fn());
const retrievePaymentMethod = vi.hoisted(() => vi.fn());
const updateCustomer = vi.hoisted(() => vi.fn());
const createPrice = vi.hoisted(() => vi.fn());
const createSubscription = vi.hoisted(() => vi.fn());
const insertedValues = vi.hoisted(() => vi.fn());
const selectedRows = vi.hoisted(() => ({ queue: [] as any[] }));

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = { constructEvent };
    paymentIntents = { retrieve: retrievePaymentIntent };
    paymentMethods = { retrieve: retrievePaymentMethod };
    customers = { update: updateCustomer };
    prices = { create: createPrice };
    subscriptions = { create: createSubscription };
  },
}));
vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => {
      const rows = selectedRows.queue.shift() ?? [];
      return Object.assign(Promise.resolve(rows), { limit: async () => rows });
    } }) }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
    insert: () => ({ values: (values: any) => { insertedValues(values); return Promise.resolve(undefined); } }),
  }),
}));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));

import { handleStripeWebhook } from "./stripeWebhook";

describe("automatic family discount webhook fulfillment", () => {
  beforeEach(() => {
    constructEvent.mockReset(); retrievePaymentIntent.mockReset(); retrievePaymentMethod.mockReset();
    updateCustomer.mockReset(); createPrice.mockReset(); createSubscription.mockReset(); insertedValues.mockReset();
    selectedRows.queue = [
      [{ id: 900003, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_family", membershipPackageId: 1 }],
      [{ id: 1, name: "Foundation", monthlyPrice: "149.00", stripePriceId: "price_foundation", totalPrice: "1887.00", durationMonths: 12 }],
      [{ id: 1, enrollmentId: 700001, memberOrder: 1 }],
    ];
    constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: {
      metadata: { type: "membership_enrollment_checkout", enrollmentId: "900003", familyGroupId: "44", familyMemberOrder: "2", recurringMonthlyAmount: "74.50", familyDiscount: "50_percent" },
      payment_intent: "pi_family", amount_total: 9900,
    } } });
    retrievePaymentIntent.mockResolvedValue({ status: "succeeded", customer: "cus_family", payment_method: "pm_family" });
    retrievePaymentMethod.mockResolvedValue({ id: "pm_family", type: "card", card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030, wallet: null } });
    createPrice.mockResolvedValue({ id: "price_family_half" });
    createSubscription.mockResolvedValue({ id: "sub_family_half" });
  });

  it("creates a $74.50 recurring price and records the enrollment as the discounted second family member", async () => {
    const response = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
    await handleStripeWebhook({ headers: { "stripe-signature": "sig" }, body: Buffer.from("payload") } as any, response as any);

    expect(createPrice).toHaveBeenCalledWith(expect.objectContaining({ unit_amount: 7450, recurring: { interval: "month" } }));
    expect(createSubscription).toHaveBeenCalledWith(expect.objectContaining({ items: [{ price: "price_family_half" }], metadata: expect.objectContaining({ familyDiscount: "50_percent", familyMemberOrder: "2" }) }));
    expect(insertedValues).toHaveBeenCalledWith(expect.objectContaining({ familyGroupId: 44, enrollmentId: 900003, memberOrder: 2, hasDiscount: 1, discountedMonthlyAmount: "74.50" }));
  });
});
