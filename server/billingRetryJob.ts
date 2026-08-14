/**
 * Stripe recurring billing recovery job.
 *
 * Endpoint: POST /api/scheduled/billingRetry
 *
 * Retries only a Stripe invoice already associated with an open failure record.
 * It never creates direct card charges or uses legacy vaulted payment methods.
 */
import type { Request, Response } from "express";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { getStripe } from "./stripeHelper";

export async function handleBillingRetry(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const openFailures = await db.select().from(schema.paymentFailures).where(
      and(eq(schema.paymentFailures.status, "open"), lt(schema.paymentFailures.createdAt, threeDaysAgo))
    );
    const stripe = getStripe();
    let retried = 0;
    let succeeded = 0;
    let needsUpdate = 0;

    for (const failure of openFailures) {
      if ((failure.retryCount ?? 0) >= 3) continue;
      const [enrollment] = await db.select().from(schema.enrollments)
        .where(eq(schema.enrollments.id, failure.enrollmentId)).limit(1);
      if (!enrollment) continue;

      // Historic legacy failures are not recharged automatically. Staff can ask the
      // member to securely update their method, then Stripe handles future invoices.
      if (!failure.stripeInvoiceId) {
        await db.update(schema.paymentFailures).set({ retryCount: (failure.retryCount ?? 0) + 1 })
          .where(eq(schema.paymentFailures.id, failure.id));
        needsUpdate++;
        continue;
      }

      retried++;
      try {
        const invoice = await stripe.invoices.retrieve(failure.stripeInvoiceId);
        const paidInvoice = invoice.status === "paid" ? invoice : await stripe.invoices.pay(invoice.id);
        if (paidInvoice.status !== "paid") throw new Error(`Invoice status: ${paidInvoice.status}`);

        await db.update(schema.paymentFailures).set({ status: "resolved" })
          .where(eq(schema.paymentFailures.id, failure.id));
        await db.update(schema.enrollments).set({ status: "active" })
          .where(eq(schema.enrollments.id, enrollment.id));
        succeeded++;
        await notifyOwner({
          title: `Payment recovery succeeded: ${enrollment.studentName || enrollment.customerName}`,
          content: `The Stripe invoice retry completed and the membership was restored.`,
        }).catch(() => {});
      } catch (error) {
        const retryCount = (failure.retryCount ?? 0) + 1;
        await db.update(schema.paymentFailures).set({ retryCount })
          .where(eq(schema.paymentFailures.id, failure.id));
        needsUpdate++;
        if (enrollment.customerPhone) {
          try {
            const { sendSms, normalizePhone } = await import("./sms800");
            await sendSms({
              to: normalizePhone(enrollment.customerPhone),
              message: `Hi ${enrollment.customerName.split(" ")[0]}, this is MyDojo. Please update your payment method securely at mydojoma.com so we can continue ${enrollment.studentName || enrollment.customerName}'s membership. Reply STOP to unsubscribe.`,
            });
          } catch {}
        }
        if (retryCount >= 2) {
          await notifyOwner({
            title: `Payment method update needed: ${enrollment.studentName || enrollment.customerName}`,
            content: `Stripe invoice recovery could not complete after ${retryCount} attempts. Please ask the family to update their payment method.`,
          }).catch(() => {});
        }
        console.error("[BillingRetry] Stripe invoice recovery failed", { failureId: failure.id, error });
      }
    }

    return res.json({ ok: true, retried, succeeded, needsUpdate });
  } catch (error) {
    console.error("[BillingRetry] Fatal error", error);
    return res.status(500).json({ error: String(error), timestamp: new Date().toISOString() });
  }
}
