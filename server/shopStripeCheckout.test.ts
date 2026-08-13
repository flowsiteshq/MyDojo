import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

const stripeCheckoutCreate = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { create: stripeCheckoutCreate } };
  },
}));

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const shopRouterSource = read("server/shopRouter.ts");
const checkoutModal = read("client/src/components/ShopCheckoutModal.tsx");
const dashboard = read("client/src/pages/MemberDashboard2.tsx");
const catalog = read("client/src/data/shopCatalog.ts");
const schema = read("drizzle/schema.ts");
const webhook = read("server/stripeWebhook.ts");

describe("student Pro Shop and Stripe checkout", () => {
  beforeEach(() => {
    stripeCheckoutCreate.mockReset();
    stripeCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.test/session/shop-123" });
    process.env.STRIPE_SECRET_KEY = "sk_test_shop_checkout";
  });
  it("shows a real catalog inside the student Shop tab", () => {
    expect(dashboard).toContain("STUDENT_SHOP_PRODUCTS.map");
    expect(dashboard).toContain("Member Store");
    expect(dashboard).toContain("Secure checkout powered by Stripe");
    expect(catalog).toContain("kihon-gi");
    expect(catalog).toContain("kickboxing-gloves");
    expect(catalog).toContain("tetsujin-gi");
  });

  it("creates server-priced Stripe Checkout sessions for shop purchases", () => {
    expect(shopRouterSource).toContain("createCheckout: publicProcedure");
    expect(shopRouterSource).toContain("const product = SHOP_CATALOG[input.productId]");
    expect(shopRouterSource).toContain("stripe.checkout.sessions.create");
    expect(shopRouterSource).toContain('mode: "payment"');
    expect(shopRouterSource).toContain('type: "shop_purchase"');
    expect(shopRouterSource).not.toContain("amountCents: z.number");
    expect(shopRouterSource).not.toContain("FluidPay");
  });

  it("sends the customer to Stripe rather than tokenizing card data in the app", () => {
    expect(checkoutModal).toContain("Checkout with Stripe");
    expect(checkoutModal).toContain("trpc.shop.createCheckout.useMutation");
    expect(checkoutModal).toContain("window.location.assign(checkoutUrl)");
    expect(checkoutModal).not.toContain("FluidPay");
    expect(checkoutModal).not.toContain("Tokenizer");
  });

  it("creates a controlled Stripe Checkout URL without charging the shopper", async () => {
    const caller = appRouter.createCaller({ req: { headers: { origin: "https://portal.mydojo.test" } } } as any);
    const result = await caller.shop.createCheckout({
      productId: "kihon-gi",
      size: "2",
      customerName: "Vincent Holmes",
      customerEmail: "sensei30002003@gmail.com",
      returnTo: "/dashboard",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/session/shop-123");
    expect(stripeCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      customer_email: "sensei30002003@gmail.com",
      success_url: "https://portal.mydojo.test/dashboard?shop=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://portal.mydojo.test/dashboard?shop=cancelled",
      metadata: expect.objectContaining({ type: "shop_purchase", product_id: "kihon-gi", size: "2" }),
    }));
  });

  it("records paid shop purchases for fulfillment and presents post-checkout feedback", () => {
    expect(schema).toContain('export const shopOrders = mysqlTable("shopOrders"');
    expect(schema).toContain("stripeSessionId");
    expect(webhook).toContain('session.metadata?.type === "shop_purchase"');
    expect(webhook).toContain("handleShopPurchase");
    expect(webhook).toContain("fulfillmentStatus: \"pending\"");
    expect(dashboard).toContain("Order received — your MyDojo team will follow up with fulfillment details.");
    expect(read("client/src/pages/Shop.tsx")).toContain("Order received");
  });
});
