/**
 * Scheduled (Future-Dated) Payments Router
 *
 * Allows admins to schedule a payment for a future date.
 *
 * Flow: hosted secure setup authorizes a reusable payment method, then the heartbeat job charges it through Stripe on the scheduled date.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { getOrCreateStripeCustomer, getStripe } from "./stripeHelper";

// ─── Router ───────────────────────────────────────────────────────────────────

export const scheduledPaymentsRouter = router({
  /** Starts hosted card setup for a future scheduled charge; no money is collected today. */
  createSetupCheckout: protectedProcedure
    .input(z.object({
      customerName: z.string().min(1),
      customerEmail: z.string().email().optional().or(z.literal("")),
      customerPhone: z.string().optional(),
      amount: z.number().positive(),
      description: z.string().min(1),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      origin: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const customer = await getOrCreateStripeCustomer({ email: input.customerEmail || undefined, name: input.customerName, phone: input.customerPhone });
      const stripe = getStripe();
      const origin = input.origin?.startsWith("https://mydojoma.com") ? input.origin : "https://mydojoma.com";
      const session = await stripe.checkout.sessions.create({
        mode: "setup",
        customer: customer.id,
        success_url: `${origin}/admin/scheduled-payments?setup=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/admin/scheduled-payments?setup=cancelled`,
        metadata: {
          type: "scheduled_payment_setup",
          customerName: input.customerName,
          customerEmail: input.customerEmail || "",
          customerPhone: input.customerPhone || "",
          amount: input.amount.toFixed(2),
          description: input.description,
          scheduledDate: input.scheduledDate,
          createdByUserId: String(ctx.user.id),
        },
      });
      if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to start secure payment setup" });
      return { checkoutUrl: session.url };
    }),
  /** List all scheduled payments (admin only) */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "charged", "failed", "cancelled", "all"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows =
        input.status === "all"
          ? await db
              .select()
              .from(schema.scheduledPayments)
              .orderBy(desc(schema.scheduledPayments.scheduledDate))
          : await db
              .select()
              .from(schema.scheduledPayments)
              .where(eq(schema.scheduledPayments.status, input.status as any))
              .orderBy(desc(schema.scheduledPayments.scheduledDate));

      return rows;
    }),

  /** Cancel a pending scheduled payment */
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [row] = await db
        .select()
        .from(schema.scheduledPayments)
        .where(eq(schema.scheduledPayments.id, input.id));

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Scheduled payment not found" });
      if (row.status !== "pending")
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot cancel a payment with status '${row.status}'` });

      await db
        .update(schema.scheduledPayments)
        .set({ status: "cancelled" })
        .where(eq(schema.scheduledPayments.id, input.id));

      return { success: true };
    }),

  /** Manually trigger a charge for a specific scheduled payment (admin override) */
  chargeNow: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [row] = await db
        .select()
        .from(schema.scheduledPayments)
        .where(eq(schema.scheduledPayments.id, input.id));

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Scheduled payment not found" });
      if (row.status !== "pending")
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot charge a payment with status '${row.status}'` });
      if (!row.stripeCustomerId || !row.stripePaymentMethodId)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Missing payment method — cannot charge" });

      const amount = parseFloat(row.amount as string);

      try {
        let transactionId: string;
        let stripePaymentIntentId: string | null = null;
        const intent = await getStripe().paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "usd",
          customer: row.stripeCustomerId,
          payment_method: row.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: row.description,
          metadata: { type: "scheduled_payment", scheduledPaymentId: String(row.id) },
        });
        transactionId = intent.id;
        stripePaymentIntentId = intent.id;

        await db
          .update(schema.scheduledPayments)
          .set({ status: "charged", chargeTransactionId: transactionId, stripePaymentIntentId, chargedAt: new Date() })
          .where(eq(schema.scheduledPayments.id, input.id));

        return { success: true, transactionId };
      } catch (err: any) {
        await db
          .update(schema.scheduledPayments)
          .set({ status: "failed", failureReason: err.message })
          .where(eq(schema.scheduledPayments.id, input.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }
    }),
});
