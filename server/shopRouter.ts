import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { createPayPalOrder } from "./paypalHelper";

const SHOP_CATALOG: Record<string, { name: string; amountCents: number; category: string; colors?: string[] }> = {
  "kihon-gi": { name: "Kihon Gi", amountCents: 4900, category: "Uniforms & Gis" },
  "mydojo-classic-tshirt": { name: "MyDojo Classic T-Shirt", amountCents: 2900, category: "Apparel" },
  "kickboxing-gloves": { name: "Kickboxing Gloves", amountCents: 6900, category: "Fight Gear" },
  "kiacho-gi-middle": { name: "Kaicho Gi — Middle Weight", amountCents: 6850, category: "Uniforms & Gis" },
  "kiacho-gi-heavy": { name: "Kaicho Gi — Heavy Weight", amountCents: 9900, category: "Uniforms & Gis" },
  "shinobi-gi-middle": { name: "Shinobi Gi — Middle Weight", amountCents: 6850, category: "Uniforms & Gis" },
  "shinobi-gi-heavy": { name: "Shinobi Gi — Heavy Weight", amountCents: 9900, category: "Uniforms & Gis" },
  "tetsujin-gi": { name: "Tetsujin Gi", amountCents: 22500, category: "Uniforms & Gis" },
  "mydojo-sparring-gear-package": {
    name: "MyDojo Sparring Gear Package",
    amountCents: 19500,
    category: "Fight Gear",
    colors: ["Red", "Black", "White", "Pink"],
  },
};

const GEAR_PRODUCT_ID = "mydojo-sparring-gear-package";
const GEAR_SIZES = ["Youth S", "Youth M", "Youth L", "Adult S", "Adult M", "Adult L", "Adult XL"] as const;
const GEAR_COLORS = ["Red", "Black", "White", "Pink"] as const;

export const shopRouter = router({
  createCheckout: publicProcedure
    .input(z.object({
      productId: z.string().min(1),
      size: z.string().max(32).optional(),
      color: z.string().max(32).optional(),
      customerName: z.string().min(1).max(120),
      customerEmail: z.string().email(),
      customerPhone: z.string().max(40).optional(),
      returnTo: z.enum(["/shop", "/dashboard"]).default("/shop"),
    }))
    .mutation(async ({ input, ctx }) => {
      const product = SHOP_CATALOG[input.productId];
      if (!product) throw new TRPCError({ code: "BAD_REQUEST", message: "This shop item is unavailable." });
      if (product.colors && !product.colors.includes(input.color ?? "")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Please select an available gear color." });
      }

      const secretKey = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
      if (!secretKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe checkout is not configured." });

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" as any });
      const origin = (ctx.req.headers.origin as string) || "https://mydojoma.com";
      const options = [input.size ? `Size: ${input.size}` : null, input.color ? `Color: ${input.color}` : null].filter(Boolean).join(" · ");
      const description = options ? `${product.category} · ${options}` : product.category;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: input.customerEmail,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: product.name, description },
            unit_amount: product.amountCents,
          },
          quantity: 1,
        }],
        metadata: {
          type: "shop_purchase",
          product_id: input.productId,
          product_name: product.name,
          product_category: product.category,
          customer_name: input.customerName,
          customer_phone: input.customerPhone || "",
          size: input.size || "",
          color: input.color || "",
        },
        success_url: `${origin}${input.returnTo}?shop=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${input.returnTo}?shop=cancelled`,
      });

      if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe did not return a checkout URL." });
      return { checkoutUrl: session.url };
    }),

  createPayPalGearCheckout: publicProcedure
    .input(z.object({
      studentName: z.string().min(1).max(255),
      customerName: z.string().min(1).max(120),
      customerEmail: z.string().email(),
      customerPhone: z.string().max(40).optional(),
      size: z.enum(GEAR_SIZES),
      color: z.enum(GEAR_COLORS),
      returnTo: z.enum(["/shop", "/dashboard"]).default("/shop"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const { randomUUID } = await import("node:crypto");
      const orderReference = `gear-${randomUUID()}`;
      const product = SHOP_CATALOG[GEAR_PRODUCT_ID];
      if (!product) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gear product is unavailable." });
      await db.insert(schema.gearOrders).values({
        orderReference,
        customerName: input.customerName,
        studentName: input.studentName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone || null,
        productId: GEAR_PRODUCT_ID,
        productName: product.name,
        size: input.size,
        color: input.color,
        amountCents: product.amountCents,
        paymentStatus: "pending",
      });
      try {
        const origin = (ctx.req.headers.origin as string) || "https://www.mydojoma.com";
        const order = await createPayPalOrder({
          amountCents: product.amountCents,
          referenceId: orderReference,
          customId: orderReference,
          returnUrl: `${origin}${input.returnTo}?gear=paypal-pending&order_reference=${encodeURIComponent(orderReference)}`,
          cancelUrl: `${origin}${input.returnTo}?gear=cancelled&order_reference=${encodeURIComponent(orderReference)}`,
        });
        await db.update(schema.gearOrders).set({ paypalOrderId: order.orderId }).where(eq(schema.gearOrders.orderReference, orderReference));
        return { checkoutUrl: order.approvalUrl, orderReference, amountCents: product.amountCents };
      } catch (error) {
        await db.update(schema.gearOrders).set({ paymentStatus: "failed", lastError: "PayPal order creation failed" }).where(eq(schema.gearOrders.orderReference, orderReference));
        console.error("[PayPal gear checkout]", error);
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Unable to create secure PayPal checkout." });
      }
    }),
});
