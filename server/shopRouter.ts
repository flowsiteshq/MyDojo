import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";

const SHOP_CATALOG: Record<string, { name: string; amountCents: number; category: string }> = {
  "kihon-gi": { name: "Kihon Gi", amountCents: 4900, category: "Uniforms & Gis" },
  "mydojo-classic-tshirt": { name: "MyDojo Classic T-Shirt", amountCents: 2900, category: "Apparel" },
  "kickboxing-gloves": { name: "Kickboxing Gloves", amountCents: 6900, category: "Fight Gear" },
  "kiacho-gi-middle": { name: "Kaicho Gi — Middle Weight", amountCents: 6850, category: "Uniforms & Gis" },
  "kiacho-gi-heavy": { name: "Kaicho Gi — Heavy Weight", amountCents: 9900, category: "Uniforms & Gis" },
  "shinobi-gi-middle": { name: "Shinobi Gi — Middle Weight", amountCents: 6850, category: "Uniforms & Gis" },
  "shinobi-gi-heavy": { name: "Shinobi Gi — Heavy Weight", amountCents: 9900, category: "Uniforms & Gis" },
  "tetsujin-gi": { name: "Tetsujin Gi", amountCents: 22500, category: "Uniforms & Gis" },
};

export const shopRouter = router({
  createCheckout: publicProcedure
    .input(z.object({
      productId: z.string().min(1),
      size: z.string().max(32).optional(),
      customerName: z.string().min(1).max(120),
      customerEmail: z.string().email(),
      customerPhone: z.string().max(40).optional(),
      returnTo: z.enum(["/shop", "/dashboard"]).default("/shop"),
    }))
    .mutation(async ({ input, ctx }) => {
      const product = SHOP_CATALOG[input.productId];
      if (!product) throw new TRPCError({ code: "BAD_REQUEST", message: "This shop item is unavailable." });

      const secretKey = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
      if (!secretKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe checkout is not configured." });

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" as any });
      const origin = (ctx.req.headers.origin as string) || "https://mydojoma.com";
      const description = input.size ? `${product.category} · Size: ${input.size}` : product.category;

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
        },
        success_url: `${origin}${input.returnTo}?shop=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${input.returnTo}?shop=cancelled`,
      });

      if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe did not return a checkout URL." });
      return { checkoutUrl: session.url };
    }),
});
