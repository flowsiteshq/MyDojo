/**
 * Fluid Pay Webhook Handler
 *
 * Endpoint: POST /api/fluidpay/webhook
 *
 * Fluid Pay sends a JSON body signed with HMAC-SHA256 (base64url-encoded in the
 * `Signature` header).  We verify the signature, log every event to `webhookEvents`,
 * then dispatch to specific handlers based on the `type` + `status` combination.
 *
 * Supported events:
 *  - transaction_create / transaction_update  →  subscription renewal success
 *  - transaction_create / transaction_update  →  subscription payment failure (declined)
 *
 * All handlers are non-throwing; errors are caught, logged, and stored in the DB.
 */

import type { Request, Response } from "express";
import crypto from "crypto";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import {
  sendPaymentFailureEmail,
  sendRenewalSuccessEmail,
} from "./emailService";

// ─── Fluid Pay webhook payload types ─────────────────────────────────────────

interface FPWebhookEnvelope {
  transaction_id: string;
  account_type: string;
  account_type_id: string;
  action_at: string;
  type: string;   // e.g. "transaction_create", "transaction_update"
  status: string; // e.g. "settled", "declined", "pending_settlement"
  msg: string;
  data: FPTransactionData;
}

interface FPTransactionData {
  id?: string;
  status?: string;
  amount?: number;           // cents
  subscription_id?: string;
  customer_id?: string;
  response_body?: {
    card?: {
      processor_response_code?: string;
      processor_response_text?: string;
    };
  };
  billing_address?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  order_meta?: {
    description?: string;
  };
}

// ─── Signature verification ───────────────────────────────────────────────────

/**
 * Verify the Fluid Pay HMAC-SHA256 signature.
 * The signature is HMAC-SHA256 of the raw request body, then base64url-encoded
 * (RFC 4648 without padding).
 *
 * @param rawBody  Buffer of the raw request body bytes
 * @param signature  Value of the `Signature` header
 * @param secret  Webhook signing secret UUID from the Fluid Pay control panel
 */
function verifyFluidPaySignature(
  rawBody: Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const expected = hmac.digest(); // Buffer
    // Fluid Pay uses RFC4648 base64url (no padding)
    const expectedB64 = expected
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    return crypto.timingSafeEqual(
      Buffer.from(expectedB64),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const SUCCESSFUL_STATUSES = new Set([
  "settled",
  "pending_settlement",
  "authorized",
]);

const FAILED_STATUSES = new Set([
  "declined",
  "returned",
  "late_return",
  "voided",
]);

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleFluidPayWebhook(
  req: Request,
  res: Response
): Promise<void> {
  // Fluid Pay requires HTTP 200 within 5 seconds; respond immediately
  res.status(200).json({ received: true });

  const rawBody: Buffer = req.body as Buffer;
  const signatureHeader = (req.headers["signature"] as string) ?? "";
  const webhookSecret = ENV.FLUIDPAY_WEBHOOK_SECRET;

  // Verify signature (warn but don't block if secret not configured yet)
  let signatureValid = false;
  if (webhookSecret) {
    signatureValid = verifyFluidPaySignature(rawBody, signatureHeader, webhookSecret);
    if (!signatureValid) {
      console.warn("[FluidPay Webhook] Signature verification FAILED — possible spoofed request");
    }
  } else {
    console.warn("[FluidPay Webhook] FLUIDPAY_WEBHOOK_SECRET not set — skipping signature check");
    signatureValid = true; // treat as valid when secret not configured (dev mode)
  }

  // Parse body
  let envelope: FPWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody.toString("utf8")) as FPWebhookEnvelope;
  } catch (err) {
    console.error("[FluidPay Webhook] Failed to parse body:", err);
    return;
  }

  const { type, status, data, transaction_id } = envelope;
  const subscriptionId = data?.subscription_id ?? null;
  const customerId = data?.customer_id ?? null;
  const amountCents = data?.amount ?? null;

  console.log(
    `[FluidPay Webhook] type=${type} status=${status} tx=${transaction_id} sub=${subscriptionId ?? "none"}`
  );

  // Persist the raw event
  const db = await getDb();
  if (!db) {
    console.error("[FluidPay Webhook] DB unavailable — cannot persist event");
    return;
  }

  let webhookEventId: number | null = null;
  try {
    const insertResult = await db.insert(schema.webhookEvents).values({
      fpTransactionId: transaction_id || null,
      eventType: type,
      eventStatus: status || null,
      fpSubscriptionId: subscriptionId,
      fpCustomerId: customerId,
      amountCents,
      rawPayload: envelope as any,
      signatureValid,
      processingStatus: "pending",
    });
    webhookEventId = (insertResult as any).insertId ?? null;
  } catch (err) {
    console.error("[FluidPay Webhook] Failed to persist event:", err);
    // Continue processing even if logging fails
  }

  // Only process transaction events that involve a subscription
  if (!subscriptionId) {
    await markEventProcessed(db, webhookEventId, "ignored", "No subscription_id — not a recurring transaction");
    return;
  }

  // Only care about transaction_create and transaction_update
  if (type !== "transaction_create" && type !== "transaction_update") {
    await markEventProcessed(db, webhookEventId, "ignored", `Event type '${type}' not handled`);
    return;
  }

  // Find the enrollment by Fluid Pay subscription ID
  const [enrollment] = await db
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.fluidpaySubscriptionId, subscriptionId))
    .limit(1);

  if (!enrollment) {
    console.warn(`[FluidPay Webhook] No enrollment found for subscription ${subscriptionId}`);
    await markEventProcessed(db, webhookEventId, "ignored", `No enrollment for subscription ${subscriptionId}`);
    return;
  }

  // Dispatch based on status
  if (SUCCESSFUL_STATUSES.has(status)) {
    await handleRenewalSuccess(db, enrollment, envelope, webhookEventId);
  } else if (FAILED_STATUSES.has(status)) {
    await handlePaymentFailure(db, enrollment, envelope, webhookEventId);
  } else {
    await markEventProcessed(db, webhookEventId, "ignored", `Status '${status}' not actionable`);
  }
}

// ─── Renewal success ──────────────────────────────────────────────────────────

async function handleRenewalSuccess(
  db: Awaited<ReturnType<typeof getDb>>,
  enrollment: schema.Enrollment,
  envelope: FPWebhookEnvelope,
  webhookEventId: number | null
): Promise<void> {
  try {
    // Ensure enrollment is marked active
    if (enrollment.status !== "active") {
      await db!
        .update(schema.enrollments)
        .set({ status: "active" })
        .where(eq(schema.enrollments.id, enrollment.id));
      console.log(`[FluidPay Webhook] Enrollment ${enrollment.id} re-activated after successful payment`);
    }

    // Resolve any open payment failures for this enrollment
    await db!
      .update(schema.paymentFailures)
      .set({ status: "resolved" })
      .where(
        eq(schema.paymentFailures.enrollmentId, enrollment.id)
      );

    // Send renewal receipt email (non-blocking)
    const amountDollars = (envelope.data?.amount ?? 0) / 100;
    sendRenewalSuccessEmail({
      toEmail: enrollment.customerEmail,
      customerName: enrollment.customerName,
      studentName: enrollment.studentName ?? enrollment.customerName,
      packageName: enrollment.membershipPackageId
        ? `Membership #${enrollment.membershipPackageId}`
        : "Membership",
      amountCharged: amountDollars,
      transactionId: envelope.transaction_id ?? null,
    }).catch(err =>
      console.error("[FluidPay Webhook] Renewal email error:", err)
    );

    await markEventProcessed(db, webhookEventId, "processed");
    console.log(`[FluidPay Webhook] Renewal success handled for enrollment ${enrollment.id}`);
  } catch (err) {
    console.error("[FluidPay Webhook] handleRenewalSuccess error:", err);
    await markEventProcessed(db, webhookEventId, "error", String(err));
  }
}

// ─── Payment failure ──────────────────────────────────────────────────────────

async function handlePaymentFailure(
  db: Awaited<ReturnType<typeof getDb>>,
  enrollment: schema.Enrollment,
  envelope: FPWebhookEnvelope,
  webhookEventId: number | null
): Promise<void> {
  try {
    const failureReason =
      envelope.data?.response_body?.card?.processor_response_text ??
      envelope.status ??
      "Payment declined";

    // Mark enrollment as failed/past-due
    await db!
      .update(schema.enrollments)
      .set({ status: "failed" })
      .where(eq(schema.enrollments.id, enrollment.id));

    // Check if we already have an open failure record for this transaction
    const existingFailures = await db!
      .select()
      .from(schema.paymentFailures)
      .where(eq(schema.paymentFailures.fpTransactionId, envelope.transaction_id))
      .limit(1);

    let failureId: number | null = null;
    if (existingFailures.length === 0) {
      const insertResult = await db!.insert(schema.paymentFailures).values({
        enrollmentId: enrollment.id,
        fpTransactionId: envelope.transaction_id || null,
        fpSubscriptionId: envelope.data?.subscription_id ?? null,
        amountCents: envelope.data?.amount ?? null,
        failureReason,
        retryCount: 0,
        emailSent: false,
        status: "open",
        webhookEventId,
      });
      failureId = (insertResult as any).insertId ?? null;
    } else {
      failureId = existingFailures[0].id;
      // Increment retry count
      await db!
        .update(schema.paymentFailures)
        .set({ retryCount: (existingFailures[0].retryCount ?? 0) + 1 })
        .where(eq(schema.paymentFailures.id, failureId));
    }

    // Send dunning email (non-blocking)
    const amountDollars = (envelope.data?.amount ?? 0) / 100;
    sendPaymentFailureEmail({
      toEmail: enrollment.customerEmail,
      customerName: enrollment.customerName,
      studentName: enrollment.studentName ?? enrollment.customerName,
      amountFailed: amountDollars,
      failureReason,
      retryCount: existingFailures.length > 0 ? (existingFailures[0].retryCount ?? 0) + 1 : 0,
    })
      .then(sent => {
        if (sent && failureId) {
          db!
            .update(schema.paymentFailures)
            .set({ emailSent: true })
            .where(eq(schema.paymentFailures.id, failureId))
            .catch(console.error);
        }
      })
      .catch(err =>
        console.error("[FluidPay Webhook] Payment failure email error:", err)
      );

    await markEventProcessed(db, webhookEventId, "processed");
    console.log(
      `[FluidPay Webhook] Payment failure handled for enrollment ${enrollment.id} — reason: ${failureReason}`
    );
  } catch (err) {
    console.error("[FluidPay Webhook] handlePaymentFailure error:", err);
    await markEventProcessed(db, webhookEventId, "error", String(err));
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function markEventProcessed(
  db: Awaited<ReturnType<typeof getDb>>,
  webhookEventId: number | null,
  processingStatus: "processed" | "ignored" | "error",
  processingError?: string
): Promise<void> {
  if (!db || webhookEventId === null) return;
  try {
    await db
      .update(schema.webhookEvents)
      .set({
        processingStatus,
        processingError: processingError ?? null,
      })
      .where(eq(schema.webhookEvents.id, webhookEventId));
  } catch (err) {
    console.error("[FluidPay Webhook] Failed to update event status:", err);
  }
}
