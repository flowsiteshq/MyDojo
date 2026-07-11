/**
 * Scheduled Payments Heartbeat Job
 *
 * Runs daily. Finds all scheduledPayments rows where:
 *   - status = 'pending'
 *   - scheduledDate <= today
 *
 * For each match it:
 *   1. Charges the stored vault card for the full amount
 *   2. Marks status = 'charged' (success) or 'failed' (failure)
 *   3. Sends an SMS to staff on failure so they can follow up
 */

import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { chargeVaultedCard } from "./scheduledPaymentsRouter";
import { sendSms } from "./sms800";

export async function runScheduledPaymentsJob() {
  console.log("[ScheduledPayments Job] Starting...");
  const db = await getDb();
  if (!db) {
    console.error("[ScheduledPayments Job] Database unavailable");
    return { success: false, processed: 0, charged: 0, failed: 0 };
  }

  const today = new Date();
  // Format as YYYY-MM-DD for comparison with the date column
  const todayStr = today.toISOString().split("T")[0];

  // Find all pending scheduled payments whose date has arrived
  const pending = await db
    .select()
    .from(schema.scheduledPayments)
    .where(
      and(
        eq(schema.scheduledPayments.status, "pending"),
        isNotNull(schema.scheduledPayments.fluidpayCustomerId),
        isNotNull(schema.scheduledPayments.fluidpayPaymentMethodId),
        lte(schema.scheduledPayments.scheduledDate, todayStr as unknown as Date)
      )
    );

  console.log(`[ScheduledPayments Job] Found ${pending.length} due payment(s)`);

  let charged = 0;
  let failed = 0;

  for (const payment of pending) {
    const amount = parseFloat(payment.amount as string);

    if (!amount || !payment.fluidpayCustomerId || !payment.fluidpayPaymentMethodId) {
      console.warn(`[ScheduledPayments Job] Payment ${payment.id}: missing data, skipping`);
      failed++;
      await db
        .update(schema.scheduledPayments)
        .set({ status: "failed", failureReason: "Missing payment method or amount" })
        .where(eq(schema.scheduledPayments.id, payment.id));
      continue;
    }

    try {
      const { transactionId } = await chargeVaultedCard(
        payment.fluidpayCustomerId,
        payment.fluidpayPaymentMethodId,
        amount,
        payment.description
      );

      await db
        .update(schema.scheduledPayments)
        .set({
          status: "charged",
          chargeTransactionId: transactionId,
          chargedAt: new Date(),
        })
        .where(eq(schema.scheduledPayments.id, payment.id));

      console.log(
        `[ScheduledPayments Job] Payment ${payment.id} (${payment.customerName}): charged $${amount} — txn ${transactionId}`
      );
      charged++;
    } catch (err: any) {
      const reason = err.message || "Unknown error";
      console.warn(
        `[ScheduledPayments Job] Payment ${payment.id} (${payment.customerName}): FAILED — ${reason}`
      );
      await db
        .update(schema.scheduledPayments)
        .set({ status: "failed", failureReason: reason })
        .where(eq(schema.scheduledPayments.id, payment.id));
      await notifyStaffFailed(payment, reason);
      failed++;
    }
  }

  console.log(
    `[ScheduledPayments Job] Done — charged: ${charged}, failed: ${failed}, total: ${pending.length}`
  );
  return { success: true, processed: pending.length, charged, failed };
}

/** Notify all staff with enrollSmsNotify=1 that a scheduled payment failed */
async function notifyStaffFailed(
  payment: typeof schema.scheduledPayments.$inferSelect,
  reason?: string
) {
  try {
    const db = await getDb();
    if (!db) return;
    const staffList = await db
      .select({ phone: schema.users.phone, name: schema.users.name })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.enrollSmsNotify, 1),
          isNotNull(schema.users.phone)
        )
      );
    const amount = parseFloat(payment.amount as string).toFixed(2);
    const msg =
      `⚠️ MyDojo: Scheduled payment FAILED for ${payment.customerName}` +
      ` ($${amount} — ${payment.description}).` +
      (reason ? ` Reason: ${reason}.` : "") +
      (payment.customerPhone ? ` Contact: ${payment.customerPhone}.` : "");
    for (const staff of staffList) {
      if (staff.phone) {
        await sendSms({ to: staff.phone, message: msg }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[ScheduledPayments Job] Failed to notify staff:", err);
  }
}
