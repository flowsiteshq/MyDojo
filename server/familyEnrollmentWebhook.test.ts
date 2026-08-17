import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.hoisted(() => vi.fn());
const retrievePaymentIntent = vi.hoisted(() => vi.fn());
const retrievePaymentMethod = vi.hoisted(() => vi.fn());
const updateCustomer = vi.hoisted(() => vi.fn());
const createPrice = vi.hoisted(() => vi.fn());
const createSubscription = vi.hoisted(() => vi.fn());
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
    insert: () => ({ values: async () => undefined }),
  }),
}));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));

import { handleStripeWebhook } from "./stripeWebhook";

describe("family enrollment webhook fulfillment", () => {
  beforeEach(() => {
    selectedRows.queue = [
      [{ id: 900002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_family", membershipPackageId: 1, downPaymentAmount: "248.00" }],
      [{ id: 900002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_family", membershipPackageId: 1 }],
      [{ id: 1, name: "Foundation", monthlyPrice: "149.00", stripePriceId: "price_foundation", totalPrice: "2339.00", durationMonths: 12 }],
      [],
      [{ id: 900003, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_family", membershipPackageId: 2, downPaymentAmount: "298.00" }],
      [{ id: 900003, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_family", membershipPackageId: 2 }],
      [{ id: 2, name: "Black Belt", monthlyPrice: "199.00", stripePriceId: "price_blackbelt", totalPrice: "8700.00", durationMonths: 36 }],
      [],
    ];
    constructEvent.mockReset(); retrievePaymentIntent.mockReset(); retrievePaymentMethod.mockReset(); updateCustomer.mockReset(); createPrice.mockReset(); createSubscription.mockReset();
    constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: {
      metadata: { type: "family_membership_enrollment_checkout", enrollmentIds: "900002,900003", familyGroupId: "44", memberOrders: "1,2", recurringMonthlyAmounts: "149.00,99.50", promoCode: "" },
      payment_intent: "pi_family", amount_total: 54600,
    } } });
    retrievePaymentIntent.mockResolvedValue({ status: "succeeded", customer: "cus_family", payment_method: "pm_family" });
    retrievePaymentMethod.mockResolvedValue({ id: "pm_family", type: "card", card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030, wallet: null } });
    createPrice.mockResolvedValue({ id: "price_blackbelt_half" });
    createSubscription.mockResolvedValueOnce({ id: "sub_first" }).mockResolvedValueOnce({ id: "sub_second" });
  });

  it("activates both members, with the second member at the half-price recurring rate", async () => {
    const response = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
    await handleStripeWebhook({ headers: { "stripe-signature": "sig" }, body: Buffer.from("payload") } as any, response as any);

    expect(createSubscription).toHaveBeenNthCalledWith(1, expect.objectContaining({ items: [{ price: "price_foundation" }] }));
    expect(createPrice).toHaveBeenCalledWith(expect.objectContaining({ unit_amount: 9950, recurring: { interval: "month" } }));
    expect(createSubscription).toHaveBeenNthCalledWith(2, expect.objectContaining({ items: [{ price: "price_blackbelt_half" }], metadata: expect.objectContaining({ familyMemberOrder: "2", familyDiscount: "50_percent" }) }));
    expect(response.json).toHaveBeenCalledWith({ received: true });
  });

  it("activates three members and applies the half-price recurring rate to both the second and third members", async () => {
    selectedRows.queue = [
      [{ id: 901001, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_three", membershipPackageId: 1, downPaymentAmount: "248.00" }],
      [{ id: 901001, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_three", membershipPackageId: 1 }],
      [{ id: 1, name: "Foundation", monthlyPrice: "149.00", stripePriceId: "price_foundation", totalPrice: "2339.00", durationMonths: 12 }],
      [],
      [{ id: 901002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_three", membershipPackageId: 30001, downPaymentAmount: "198.00" }],
      [{ id: 901002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_three", membershipPackageId: 30001 }],
      [{ id: 30001, name: "Plus", monthlyPrice: "99.00", stripePriceId: "price_plus", totalPrice: "1287.00", durationMonths: 12 }],
      [],
      [{ id: 901003, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_three", membershipPackageId: 2, downPaymentAmount: "298.00" }],
      [{ id: 901003, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_three", membershipPackageId: 2 }],
      [{ id: 2, name: "Black Belt", monthlyPrice: "199.00", stripePriceId: "price_blackbelt", totalPrice: "8700.00", durationMonths: 36 }],
      [],
    ];
    constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: {
      metadata: { type: "family_membership_enrollment_checkout", enrollmentIds: "901001,901002,901003", familyGroupId: "77", memberOrders: "1,2,3", recurringMonthlyAmounts: "149.00,49.50,99.50", promoCode: "" },
      payment_intent: "pi_three", amount_total: 74400,
    } } });
    createPrice.mockReset().mockResolvedValueOnce({ id: "price_plus_half" }).mockResolvedValueOnce({ id: "price_blackbelt_half" });
    createSubscription.mockReset().mockResolvedValueOnce({ id: "sub_first" }).mockResolvedValueOnce({ id: "sub_second" }).mockResolvedValueOnce({ id: "sub_third" });
    const response = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
    await handleStripeWebhook({ headers: { "stripe-signature": "sig" }, body: Buffer.from("payload") } as any, response as any);

    expect(createPrice).toHaveBeenNthCalledWith(1, expect.objectContaining({ unit_amount: 4950 }));
    expect(createPrice).toHaveBeenNthCalledWith(2, expect.objectContaining({ unit_amount: 9950 }));
    expect(createSubscription).toHaveBeenNthCalledWith(2, expect.objectContaining({ items: [{ price: "price_plus_half" }], metadata: expect.objectContaining({ familyMemberOrder: "2", familyDiscount: "50_percent" }) }));
    expect(createSubscription).toHaveBeenNthCalledWith(3, expect.objectContaining({ items: [{ price: "price_blackbelt_half" }], metadata: expect.objectContaining({ familyMemberOrder: "3", familyDiscount: "50_percent" }) }));
    expect(response.json).toHaveBeenCalledWith({ received: true });
  });

  it("starts every two-member Back-to-School subscription at the exact stored 14-day tuition date", async () => {
    const tuitionStart = "2030-01-15T18:00:00.000Z";
    const tuitionTimestamp = Math.floor(new Date(tuitionStart).getTime() / 1000);
    selectedRows.queue = [
      [{ id: 902001, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer", membershipPackageId: 1, downPaymentAmount: "1.00" }],
      [{ id: 902001, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer", membershipPackageId: 1 }],
      [{ id: 1, name: "Foundation", monthlyPrice: "149.00", stripePriceId: "price_foundation", totalPrice: "2339.00", durationMonths: 12 }],
      [],
      [{ id: 902002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer", membershipPackageId: 2, downPaymentAmount: "0.00" }],
      [{ id: 902002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer", membershipPackageId: 2 }],
      [{ id: 2, name: "Black Belt", monthlyPrice: "199.00", stripePriceId: "price_blackbelt", totalPrice: "3111.00", durationMonths: 12 }],
      [],
    ];
    constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: {
      metadata: { type: "family_membership_enrollment_checkout", enrollmentIds: "902001,902002", familyGroupId: "88", memberOrders: "1,2", recurringMonthlyAmounts: "149.00,99.50", promoCode: "", backToSchool: "true", firstMonthPrepaid: "false", billingStartAt: tuitionStart },
      payment_intent: "pi_offer_two", amount_total: 100,
    } } });
    createPrice.mockReset().mockResolvedValue({ id: "price_blackbelt_half" });
    createSubscription.mockReset().mockResolvedValueOnce({ id: "sub_offer_first" }).mockResolvedValueOnce({ id: "sub_offer_second" });
    const response = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
    await handleStripeWebhook({ headers: { "stripe-signature": "sig" }, body: Buffer.from("payload") } as any, response as any);

    expect(createSubscription).toHaveBeenNthCalledWith(1, expect.objectContaining({ trial_end: tuitionTimestamp, metadata: expect.objectContaining({ backToSchool: "true", tuitionStartsAt: tuitionStart }) }));
    expect(createSubscription).toHaveBeenNthCalledWith(2, expect.objectContaining({ trial_end: tuitionTimestamp, items: [{ price: "price_blackbelt_half" }], metadata: expect.objectContaining({ backToSchool: "true", familyMemberOrder: "2", familyDiscount: "50_percent" }) }));
  });

  it("starts all three Back-to-School subscriptions at the stored date and discounts both later family members", async () => {
    const tuitionStart = "2030-02-01T18:00:00.000Z";
    const tuitionTimestamp = Math.floor(new Date(tuitionStart).getTime() / 1000);
    selectedRows.queue = [
      [{ id: 903001, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer_three", membershipPackageId: 1, downPaymentAmount: "1.00" }],
      [{ id: 903001, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer_three", membershipPackageId: 1 }],
      [{ id: 1, name: "Foundation", monthlyPrice: "149.00", stripePriceId: "price_foundation", totalPrice: "2339.00", durationMonths: 12 }],
      [],
      [{ id: 903002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer_three", membershipPackageId: 30001, downPaymentAmount: "0.00" }],
      [{ id: 903002, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer_three", membershipPackageId: 30001 }],
      [{ id: 30001, name: "Plus", monthlyPrice: "99.00", stripePriceId: "price_plus", totalPrice: "1287.00", durationMonths: 12 }],
      [],
      [{ id: 903003, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer_three", membershipPackageId: 2, downPaymentAmount: "0.00" }],
      [{ id: 903003, status: "pending", stripeSubscriptionId: null, stripeCustomerId: "cus_offer_three", membershipPackageId: 2 }],
      [{ id: 2, name: "Black Belt", monthlyPrice: "199.00", stripePriceId: "price_blackbelt", totalPrice: "3111.00", durationMonths: 12 }],
      [],
    ];
    constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: {
      metadata: { type: "family_membership_enrollment_checkout", enrollmentIds: "903001,903002,903003", familyGroupId: "99", memberOrders: "1,2,3", recurringMonthlyAmounts: "149.00,49.50,99.50", promoCode: "", backToSchool: "true", firstMonthPrepaid: "false", billingStartAt: tuitionStart },
      payment_intent: "pi_offer_three", amount_total: 100,
    } } });
    createPrice.mockReset().mockResolvedValueOnce({ id: "price_plus_half" }).mockResolvedValueOnce({ id: "price_blackbelt_half" });
    createSubscription.mockReset().mockResolvedValueOnce({ id: "sub_offer_first" }).mockResolvedValueOnce({ id: "sub_offer_second" }).mockResolvedValueOnce({ id: "sub_offer_third" });
    const response = { json: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() };
    await handleStripeWebhook({ headers: { "stripe-signature": "sig" }, body: Buffer.from("payload") } as any, response as any);

    expect(createSubscription).toHaveBeenNthCalledWith(1, expect.objectContaining({ trial_end: tuitionTimestamp }));
    expect(createSubscription).toHaveBeenNthCalledWith(2, expect.objectContaining({ trial_end: tuitionTimestamp, items: [{ price: "price_plus_half" }], metadata: expect.objectContaining({ familyMemberOrder: "2", familyDiscount: "50_percent", backToSchool: "true" }) }));
    expect(createSubscription).toHaveBeenNthCalledWith(3, expect.objectContaining({ trial_end: tuitionTimestamp, items: [{ price: "price_blackbelt_half" }], metadata: expect.objectContaining({ familyMemberOrder: "3", familyDiscount: "50_percent", backToSchool: "true" }) }));
  });
});
