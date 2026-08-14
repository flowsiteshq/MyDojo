import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { sendSms } from "./sms800";

/**
 * Legacy deferred tuition recovery job.
 *
 * New memberships use Stripe subscriptions and never enter this job. Historic
 * deferred-tuition records are deliberately not charged through an old vault;
 * staff receive a secure-update task instead of an unverified card charge.
 */
export async function runDeferredTuitionJob() {
  const db = await getDb();
  if (!db) return { success: false, processed: 0, charged: 0, failed: 0 };

  const pending = await db.select().from(schema.enrollments).where(and(
    eq(schema.enrollments.deferredTuitionCharged, 0),
    eq(schema.enrollments.paidFirstMonth, 0),
    eq(schema.enrollments.status, "active"),
    isNotNull(schema.enrollments.deferredTuitionDate),
    lte(schema.enrollments.deferredTuitionDate, new Date())
  ));

  for (const enrollment of pending) {
    await db.update(schema.enrollments).set({ deferredTuitionCharged: 2 })
      .where(eq(schema.enrollments.id, enrollment.id));
    await notifyStaffDeferredRequiresSecureUpdate(enrollment);
  }

  return { success: true, processed: pending.length, charged: 0, failed: pending.length };
}

async function notifyStaffDeferredRequiresSecureUpdate(enrollment: typeof schema.enrollments.$inferSelect) {
  try {
    const db = await getDb();
    if (!db) return;
    const staffList = await db.select({ phone: schema.users.phone }).from(schema.users).where(and(
      eq(schema.users.enrollSmsNotify, 1),
      isNotNull(schema.users.phone)
    ));
    const amount = Number(enrollment.deferredTuitionAmount || 0).toFixed(2);
    const message = `MyDojo billing follow-up: ${enrollment.studentName || enrollment.customerName} has deferred tuition of $${amount}. Do not charge a legacy card; ask the family to update payment securely.`;
    await Promise.all(staffList.filter((staff) => staff.phone).map((staff) => sendSms({ to: staff.phone!, message }).catch(() => {})));
  } catch (error) {
    console.error("[DeferredTuition] Failed to alert staff", error);
  }
}
