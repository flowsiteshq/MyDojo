/**
 * Scheduled (Future-Dated) Payments Router
 *
 * Allows admins to schedule a payment for a future date.
 *
 * Flow:
 *  1. createScheduledPayment — receives a FluidPay nonce (from the JS iframe),
 *     creates a vault customer, runs a $1 authorization to keep the token alive,
 *     voids the $1 auth, then stores the record with status='pending'.
 *  2. listScheduledPayments  — returns all scheduled payments (admin only).
 *  3. cancelScheduledPayment — marks a pending payment as 'cancelled'.
 *  4. chargeScheduledPayment — manually trigger a charge (admin override).
 *     The heartbeat job (scheduledPaymentsJob.ts) handles automatic charging.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

const FLUIDPAY_API_URL = "https://app.fluidpay.com";

function getFpKey() {
  const key = process.env.FLUIDPAY_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment processor not configured" });
  return key;
}

function fpHeaders() {
  return { Authorization: getFpKey(), "Content-Type": "application/json" };
}

/** Vault a card using a FluidPay payment nonce and return { customerId, paymentMethodId, last4, brand } */
async function vaultCard(nonce: string, customerName: string, customerEmail?: string) {
  // Create vault customer
  const custRes = await fetch(`${FLUIDPAY_API_URL}/api/vault/customer`, {
    method: "POST",
    headers: fpHeaders(),
    body: JSON.stringify({
      description: customerName,
      payment_method: {
        card: {
          token_id: nonce,
          billing_address: {},
        },
      },
    }),
  });
  const custData = (await custRes.json()) as any;
  if (custData.status !== "success") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: custData.msg || "Failed to vault card",
    });
  }

  const customerId: string = custData.data?.id;
  const paymentMethodId: string = custData.data?.payment_method?.card?.id;
  const last4: string = custData.data?.payment_method?.card?.card_number?.slice(-4) ?? "";
  const brand: string = custData.data?.payment_method?.card?.card_type ?? "";

  return { customerId, paymentMethodId, last4, brand };
}

/** Run a $1 authorization against a vaulted card and return the transaction ID */
async function runDollarAuth(customerId: string, paymentMethodId: string, description: string) {
  const authRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
    method: "POST",
    headers: fpHeaders(),
    body: JSON.stringify({
      type: "authorize",
      amount: 100, // $1.00 in cents
      currency: "usd",
      payment_method: {
        customer: {
          id: customerId,
          payment_method_type: "card",
          payment_method_id: paymentMethodId,
        },
      },
      order_meta: {
        description: `$1 Auth — ${description}`,
      },
    }),
  });
  const authData = (await authRes.json()) as any;

  const success =
    authData.status === "success" &&
    authData.data?.response_body?.card?.processor_response_code === "00";

  if (!success) {
    const reason =
      authData.data?.response_body?.card?.processor_response_text ||
      authData.msg ||
      "Card authorization failed";
    throw new TRPCError({ code: "BAD_REQUEST", message: reason });
  }

  return authData.data?.id as string;
}

/** Void a previously authorized transaction */
async function voidTransaction(transactionId: string) {
  try {
    await fetch(`${FLUIDPAY_API_URL}/api/transaction/${transactionId}/void`, {
      method: "POST",
      headers: fpHeaders(),
      body: JSON.stringify({}),
    });
  } catch (err) {
    // Non-fatal — log but don't throw
    console.warn(`[ScheduledPayments] Failed to void auth ${transactionId}:`, err);
  }
}

/** Charge a vaulted card the full amount */
export async function chargeVaultedCard(
  customerId: string,
  paymentMethodId: string,
  amountDollars: number,
  description: string
): Promise<{ transactionId: string }> {
  const chargeRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
    method: "POST",
    headers: fpHeaders(),
    body: JSON.stringify({
      type: "sale",
      amount: Math.round(amountDollars * 100),
      currency: "usd",
      payment_method: {
        customer: {
          id: customerId,
          payment_method_type: "card",
          payment_method_id: paymentMethodId,
        },
      },
      order_meta: { description },
    }),
  });
  const chargeData = (await chargeRes.json()) as any;

  const success =
    chargeData.status === "success" &&
    chargeData.data?.response_body?.card?.processor_response_code === "00";

  if (!success) {
    const reason =
      chargeData.data?.response_body?.card?.processor_response_text ||
      chargeData.msg ||
      "Charge declined";
    throw new Error(reason);
  }

  return { transactionId: chargeData.data?.id };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const scheduledPaymentsRouter = router({
  /**
   * Create a new scheduled payment.
   * Vaults the card, runs a $1 auth to keep the token alive, voids the auth,
   * then stores the record.
   */
  create: protectedProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email().optional().or(z.literal("")),
        customerPhone: z.string().optional(),
        amount: z.number().positive(),
        description: z.string().min(1),
        scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
        /** FluidPay payment nonce from the JS iframe */
        paymentNonce: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // 1. Vault the card
      const { customerId, paymentMethodId, last4, brand } = await vaultCard(
        input.paymentNonce,
        input.customerName,
        input.customerEmail || undefined
      );

      // 2. Run $1 auth to keep token alive
      const authTxnId = await runDollarAuth(customerId, paymentMethodId, input.description);

      // 3. Void the $1 auth immediately
      await voidTransaction(authTxnId);

      // 4. Store the scheduled payment
      const [result] = await db.insert(schema.scheduledPayments).values({
        customerName: input.customerName,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        amount: String(input.amount),
        description: input.description,
        scheduledDate: input.scheduledDate as unknown as Date,
        fluidpayCustomerId: customerId,
        fluidpayPaymentMethodId: paymentMethodId,
        authTransactionId: authTxnId,
        cardLast4: last4,
        cardBrand: brand,
        status: "pending",
        createdByUserId: ctx.user.id,
      });

      return { success: true, id: (result as any).insertId };
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
      if (!row.fluidpayCustomerId || !row.fluidpayPaymentMethodId)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Missing payment method — cannot charge" });

      const amount = parseFloat(row.amount as string);

      try {
        const { transactionId } = await chargeVaultedCard(
          row.fluidpayCustomerId,
          row.fluidpayPaymentMethodId,
          amount,
          row.description
        );

        await db
          .update(schema.scheduledPayments)
          .set({ status: "charged", chargeTransactionId: transactionId, chargedAt: new Date() })
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
