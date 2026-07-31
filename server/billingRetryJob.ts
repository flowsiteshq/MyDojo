/**
 * Billing Retry Job
 *
 * Endpoint: POST /api/scheduled/billingRetry
 *
 * Runs daily at 10 AM CDT (15:00 UTC) via Heartbeat cron.
 * Finds open paymentFailures that are 3+ days old and retries the charge.
 * On second failure, notifies the owner and sends SMS to the parent.
 * On success, marks the failure as resolved and re-activates the enrollment.
 */
import type { Request, Response } from "express";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const FLUIDPAY_API_URL = "https://app.fluidpay.com";

export async function handleBillingRetry(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const FLUIDPAY_KEY = process.env.FLUIDPAY_SECRET_KEY || "";
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Find open failures that are 3+ days old and haven't been retried more than twice
    const openFailures = await db
      .select()
      .from(schema.paymentFailures)
      .where(
        and(
          eq(schema.paymentFailures.status, "open"),
          lt(schema.paymentFailures.createdAt, threeDaysAgo)
        )
      );

    if (openFailures.length === 0) {
      console.log("[BillingRetry] No open failures to retry.");
      return res.json({ ok: true, retried: 0 });
    }

    let retried = 0;
    let succeeded = 0;
    let failedAgain = 0;

    for (const failure of openFailures) {
      try {
        // Skip if already retried 3+ times
        if ((failure.retryCount ?? 0) >= 3) {
          console.log(`[BillingRetry] Skipping failure ${failure.id} — already retried ${failure.retryCount} times`);
          continue;
        }

        // Get the enrollment
        const [enrollment] = await db
          .select()
          .from(schema.enrollments)
          .where(eq(schema.enrollments.id, failure.enrollmentId))
          .limit(1);

        if (!enrollment || !enrollment.fluidpayCustomerId) {
          console.log(`[BillingRetry] Skipping failure ${failure.id} — no enrollment or no FluidPay customer`);
          continue;
        }

        retried++;

        // Attempt to retry the charge
        const amountCents = failure.amountCents || 14900; // default $149
        const studentName = enrollment.studentName || enrollment.customerName;
        const shortId = `retry-${Date.now().toString(36).slice(-10)}`;

        const nameParts = enrollment.customerName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const chargeRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
          method: "POST",
          headers: {
            Authorization: FLUIDPAY_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "sale",
            amount: amountCents,
            currency: "usd",
            payment_method: {
              customer: {
                id: enrollment.fluidpayCustomerId,
                payment_method_type: "card",
              },
            },
            billing_address: {
              first_name: firstName,
              last_name: lastName,
              email: enrollment.customerEmail || "",
              phone: (enrollment.customerPhone || "").replace(/\D/g, ""),
            },
            order_id: shortId,
            order_meta: {
              description: `MyDojo Monthly Membership Retry - ${studentName}`,
            },
          }),
        });

        const chargeData = (await chargeRes.json()) as any;
        const chargeSuccess =
          chargeData.status === "success" &&
          (chargeData.data?.status === "approved" ||
            chargeData.data?.status === "pending_settlement");

        if (chargeSuccess) {
          // Mark failure as resolved
          await db
            .update(schema.paymentFailures)
            .set({ status: "resolved" })
            .where(eq(schema.paymentFailures.id, failure.id));

          // Re-activate enrollment
          await db
            .update(schema.enrollments)
            .set({ status: "active" })
            .where(eq(schema.enrollments.id, enrollment.id));

          succeeded++;
          console.log(
            `[BillingRetry] Retry succeeded for ${studentName} (enrollment ${enrollment.id})`
          );

          // Notify owner of success
          await notifyOwner({
            title: `✅ Retry Succeeded: ${studentName}`,
            content: `Automatic retry charge of $${(amountCents / 100).toFixed(2)} succeeded for ${studentName}. Enrollment re-activated.`,
          }).catch(() => {});
        } else {
          // Retry failed — increment retry count
          const newRetryCount = (failure.retryCount ?? 0) + 1;
          await db
            .update(schema.paymentFailures)
            .set({ retryCount: newRetryCount })
            .where(eq(schema.paymentFailures.id, failure.id));

          failedAgain++;
          const declineReason =
            chargeData.data?.response_body?.card?.processor_response_text ||
            chargeData.msg ||
            "Card declined";

          console.log(
            `[BillingRetry] Retry failed for ${studentName} (attempt ${newRetryCount}): ${declineReason}`
          );

          // Send SMS to parent if we have a phone number
          if (enrollment.customerPhone) {
            try {
              const { sendSms, normalizePhone } = await import("./sms800");
              const smsMsg =
                `Hi ${enrollment.customerName.split(" ")[0]}, this is MyDojo. ` +
                `We were unable to process your monthly payment of $${(amountCents / 100).toFixed(2)} for ${studentName}'s membership. ` +
                `Please update your payment method at mydojoma.com or call us at (832) 791-8378. ` +
                `Thank you! Reply STOP to unsubscribe.`;
              await sendSms({
                to: normalizePhone(enrollment.customerPhone),
                message: smsMsg,
              });
            } catch (smsErr) {
              console.error("[BillingRetry] SMS send failed:", smsErr);
            }
          }

          // Notify owner after 2nd failure
          if (newRetryCount >= 2) {
            await notifyOwner({
              title: `🚨 Payment Failed Twice: ${studentName}`,
              content:
                `Automatic retry #${newRetryCount} also failed for ${studentName} (${enrollment.customerName}). ` +
                `Amount: $${(amountCents / 100).toFixed(2)}. Reason: ${declineReason}. ` +
                `Phone: ${enrollment.customerPhone || "N/A"}. ` +
                `Please contact the family to update their payment method.`,
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error(`[BillingRetry] Error processing failure ${failure.id}:`, err);
      }
    }

    console.log(
      `[BillingRetry] Done: ${retried} retried, ${succeeded} succeeded, ${failedAgain} failed again`
    );

    return res.json({
      ok: true,
      retried,
      succeeded,
      failedAgain,
    });
  } catch (err) {
    console.error("[BillingRetry] Fatal error:", err);
    return res.status(500).json({
      error: String(err),
      timestamp: new Date().toISOString(),
    });
  }
}
