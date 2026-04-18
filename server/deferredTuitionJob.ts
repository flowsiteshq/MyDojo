import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { sendSms } from "./sms800";

/**
 * Background job to automatically charge deferred first-month tuition.
 *
 * Runs every 30 minutes. Finds enrollments where:
 *   - deferredTuitionDate <= now (the scheduled date has arrived)
 *   - deferredTuitionCharged = 0 (not yet charged)
 *   - paidFirstMonth = 0 (first month not yet paid)
 *   - status = 'active'
 *
 * For each match it:
 *   1. Charges the stored deferredTuitionAmount to the customer's vault card
 *   2. Marks deferredTuitionCharged = 1 (success) or 2 (failed)
 *   3. On success: sets paidFirstMonth = 1 and decrements monthlyPaymentsRemaining
 *   4. Sends an SMS to staff on failure so they can follow up
 */
export async function runDeferredTuitionJob() {
  console.log("[DeferredTuition Job] Starting...");
  const db = await getDb();
  if (!db) {
    console.error("[DeferredTuition Job] Database unavailable");
    return { success: false, processed: 0, charged: 0, failed: 0 };
  }

  const FLUIDPAY_API_URL = "https://app.fluidpay.com";
  const FLUIDPAY_SECRET_KEY = process.env.FLUIDPAY_SECRET_KEY;
  if (!FLUIDPAY_SECRET_KEY) {
    console.error("[DeferredTuition Job] FLUIDPAY_SECRET_KEY not set");
    return { success: false, processed: 0, charged: 0, failed: 0 };
  }

  const now = new Date();

  // Find all pending deferred tuition enrollments whose date has arrived
  const pending = await db
    .select()
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.deferredTuitionCharged, 0),
        eq(schema.enrollments.paidFirstMonth, 0),
        eq(schema.enrollments.status, "active"),
        isNotNull(schema.enrollments.deferredTuitionDate),
        lte(schema.enrollments.deferredTuitionDate, now)
      )
    );

  console.log(`[DeferredTuition Job] Found ${pending.length} pending deferred tuition(s)`);

  let charged = 0;
  let failed = 0;

  for (const enrollment of pending) {
    const amount = parseFloat(enrollment.deferredTuitionAmount as string);
    if (!amount || !enrollment.fluidpayCustomerId) {
      console.warn(`[DeferredTuition Job] Enrollment ${enrollment.id}: missing amount or customer ID, skipping`);
      failed++;
      await db
        .update(schema.enrollments)
        .set({ deferredTuitionCharged: 2 })
        .where(eq(schema.enrollments.id, enrollment.id));
      continue;
    }

    // Get customer vault to find payment method ID
    let paymentMethodId: string | null = null;
    try {
      const custRes = await fetch(`${FLUIDPAY_API_URL}/api/customer/${enrollment.fluidpayCustomerId}`, {
        headers: { Authorization: FLUIDPAY_SECRET_KEY },
      });
      const custData = await custRes.json() as any;
      paymentMethodId = custData?.data?.payment_method?.card?.id ?? null;
    } catch (err) {
      console.error(`[DeferredTuition Job] Enrollment ${enrollment.id}: failed to fetch customer vault`, err);
    }

    if (!paymentMethodId) {
      console.warn(`[DeferredTuition Job] Enrollment ${enrollment.id}: no payment method found`);
      failed++;
      await db
        .update(schema.enrollments)
        .set({ deferredTuitionCharged: 2 })
        .where(eq(schema.enrollments.id, enrollment.id));
      await notifyStaffDeferredFailed(enrollment);
      continue;
    }

    // Charge the deferred tuition
    try {
      const chargeRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
        method: "POST",
        headers: {
          Authorization: FLUIDPAY_SECRET_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "sale",
          amount: Math.round(amount * 100),
          currency: "usd",
          payment_method: {
            customer: {
              id: enrollment.fluidpayCustomerId,
              payment_method_type: "card",
              payment_method_id: paymentMethodId,
            },
          },
          order_meta: {
            description: `MyDojo Deferred First Month Tuition - ${enrollment.studentName || enrollment.customerName}`,
          },
        }),
      });
      const chargeData = await chargeRes.json() as any;

      const success =
        chargeData.status === "success" &&
        chargeData.data?.response_body?.card?.processor_response_code === "00";

      if (success) {
        const currentRemaining = enrollment.monthlyPaymentsRemaining ?? 0;
        await db
          .update(schema.enrollments)
          .set({
            deferredTuitionCharged: 1,
            paidFirstMonth: 1,
            monthlyPaymentsRemaining: Math.max(0, currentRemaining - 1),
          })
          .where(eq(schema.enrollments.id, enrollment.id));
        console.log(
          `[DeferredTuition Job] Enrollment ${enrollment.id} (${enrollment.studentName}): charged $${amount} successfully — txn ${chargeData.data?.id}`
        );
        charged++;
      } else {
        const errMsg =
          chargeData.data?.response_body?.card?.processor_response_text ||
          chargeData.msg ||
          "Declined";
        console.warn(
          `[DeferredTuition Job] Enrollment ${enrollment.id} (${enrollment.studentName}): charge FAILED — ${errMsg}`
        );
        await db
          .update(schema.enrollments)
          .set({ deferredTuitionCharged: 2 })
          .where(eq(schema.enrollments.id, enrollment.id));
        await notifyStaffDeferredFailed(enrollment, errMsg);
        failed++;
      }
    } catch (err) {
      console.error(`[DeferredTuition Job] Enrollment ${enrollment.id}: unexpected error`, err);
      await db
        .update(schema.enrollments)
        .set({ deferredTuitionCharged: 2 })
        .where(eq(schema.enrollments.id, enrollment.id));
      await notifyStaffDeferredFailed(enrollment, String(err));
      failed++;
    }
  }

  console.log(
    `[DeferredTuition Job] Done — charged: ${charged}, failed: ${failed}, total: ${pending.length}`
  );
  return { success: true, processed: pending.length, charged, failed };
}

/** Notify all staff with enrollSmsNotify=1 that a deferred tuition charge failed */
async function notifyStaffDeferredFailed(
  enrollment: typeof schema.enrollments.$inferSelect,
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
    const msg =
      `⚠️ MyDojo: Deferred tuition FAILED for ${enrollment.studentName || enrollment.customerName}` +
      ` ($${parseFloat(enrollment.deferredTuitionAmount as string).toFixed(2)}).` +
      (reason ? ` Reason: ${reason}.` : "") +
      ` Please follow up with ${enrollment.customerPhone}.`;
    for (const staff of staffList) {
      if (staff.phone) {
        await sendSms({ to: staff.phone, message: msg }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[DeferredTuition Job] Failed to notify staff:", err);
  }
}
