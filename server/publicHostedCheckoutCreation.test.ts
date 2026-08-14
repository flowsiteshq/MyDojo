import { beforeEach, describe, expect, it, vi } from "vitest";

const checkoutCreate = vi.hoisted(() => vi.fn());

vi.mock("./stripeHelper", () => ({
  getStripe: () => ({ checkout: { sessions: { create: checkoutCreate } } }),
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { create: checkoutCreate } };
  },
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: async () => [] }) }),
  }),
}));

import { appRouter } from "./routers";

describe("public hosted checkout creation", () => {
  beforeEach(() => {
    checkoutCreate.mockReset();
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.test/session/public-123" });
  });

  it("creates a hosted day-pass checkout session with server-controlled pricing", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.kiosk.createDayPassCheckout({
      name: "Test Parent",
      email: "test-parent@example.com",
      phone: "2815550101",
      program: "Adult Karate",
      origin: "https://mydojoma.com",
    });
    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/public-123");
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "test-parent@example.com",
      metadata: expect.objectContaining({ type: "day_pass", program: "Adult Karate" }),
    }));
  });

  it("creates a hosted introductory-offer checkout session with no embedded card handling", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.kiosk.createIntroOfferCheckout({
      name: "Test Parent",
      email: "test-parent@example.com",
      phone: "2815550101",
      packageId: "starter",
      origin: "https://mydojoma.com",
    });
    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/public-123");
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "test-parent@example.com",
      metadata: expect.objectContaining({ type: "intro_offer", introOfferPackage: "starter" }),
    }));
  });

  it("creates a hosted family registration session without collecting card data in the app", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.family.createStripeRegistrationCheckout({
      primaryContactName: "Test Parent",
      primaryContactEmail: "test-parent@example.com",
      primaryContactPhone: "2815550101",
      origin: "https://mydojoma.com",
    });
    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/public-123");
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "test-parent@example.com",
      metadata: expect.objectContaining({ type: "family_registration", primaryContactName: "Test Parent" }),
    }));
  });

  it("creates a hosted summer camp pass checkout session", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_summer_camp";
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.popup.createSummerCampCheckout({ origin: "https://mydojoma.com" });
    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/public-123");
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      metadata: expect.objectContaining({ type: "summer_camp_pass" }),
    }));
  });

  it("creates a hosted summer camp enrollment session with the submitted family details", async () => {
    const caller = appRouter.createCaller({ req: { headers: {} } } as any);
    const result = await caller.popup.createSummerCampEnrollCheckout({
      weeks: ["2026-06-08"],
      students: [{ name: "Test Student", age: 8 }],
      parentName: "Test Parent",
      parentEmail: "test-parent@example.com",
      parentPhone: "2815550101",
      isFullSummer: false,
      totalCents: 24900,
      origin: "https://mydojoma.com",
    });
    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/public-123");
    expect(checkoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "test-parent@example.com",
      metadata: expect.objectContaining({ type: "summer_camp_enrollment", parentName: "Test Parent" }),
    }));
  });
});
