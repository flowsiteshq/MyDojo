import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { enrollments, membershipPackages } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const STRIPE_SECRET_KEY = process.env.STRIPE_LIVE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
});

/**
 * Stripe webhook handler for subscription lifecycle events
 * Handles: checkout.session.completed, customer.subscription.*, invoice.payment_failed
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Route belt exam payments to a dedicated handler
        if (session.metadata?.type === "belt_exam") {
          await handleBeltExamPayment(session);
        } else {
          await handleCheckoutSessionCompleted(session);
        }
        break;
      }

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
    res.status(500).send(`Webhook processing error: ${error.message}`);
  }
}

/**
 * Handle belt exam fee payment (checkout.session.completed with metadata.type === 'belt_exam')
 * Sets beltExamFeePaid=1 on the enrollment and notifies the instructor.
 */
async function handleBeltExamPayment(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Processing belt exam payment:", session.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  const enrollmentId = session.metadata?.enrollment_id
    ? parseInt(session.metadata.enrollment_id)
    : null;
  const studentName = session.metadata?.student_name || "Student";
  const beltRank = session.metadata?.belt_rank || "Orange Belt";
  const customerEmail = session.customer_details?.email || session.customer_email || "";

  if (!enrollmentId) {
    console.error("[Stripe Webhook] Belt exam payment missing enrollment_id in metadata", { sessionId: session.id });
    return;
  }

  // Fetch the enrollment to check current state
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);

  if (!enrollment) {
    console.error("[Stripe Webhook] Enrollment not found for belt exam payment:", enrollmentId);
    return;
  }

  // Idempotency guard — don't double-process
  if (enrollment.beltExamFeePaid) {
    console.log("[Stripe Webhook] Belt exam fee already marked as paid for enrollment:", enrollmentId, "— skipping");
    return;
  }

  // Mark exam fee as paid
  await db
    .update(enrollments)
    .set({ beltExamFeePaid: 1, beltExamEligible: 1 })
    .where(eq(enrollments.id, enrollmentId));

  console.log(`[Stripe Webhook] Belt exam fee paid for ${studentName} (enrollment ${enrollmentId}) — ${beltRank}`);

  // ── Instructor email notification ──────────────────────────────────────────
  try {
    const { sendBeltExamPaidInstructorEmail } = await import("./emailService.js");
    await sendBeltExamPaidInstructorEmail({
      studentName,
      beltRank,
      customerEmail,
      enrollmentId,
      amountPaid: session.amount_total ? session.amount_total / 100 : 49,
    });
  } catch (emailErr) {
    console.error("[Stripe Webhook] Failed to send instructor email:", emailErr);
  }

  // ── Owner push notification ────────────────────────────────────────────────
  try {
    await notifyOwner({
      title: `🥋 Belt Exam Fee Paid — ${studentName}`,
      content: `${studentName} has paid the $49 belt exam fee and is ready to be scheduled for their ${beltRank} → next belt evaluation. Enrollment ID: ${enrollmentId}.`,
    });
  } catch (notifErr) {
    console.error("[Stripe Webhook] Failed to send owner notification:", notifErr);
  }
}

/**
 * Handle checkout.session.completed event
 * Creates a new enrollment record from the Stripe session metadata.
 * This is the primary enrollment creation path — no pre-created pending record is needed.
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Processing checkout.session.completed:", session.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  const subscriptionId = session.subscription as string | null;
  const customerId = session.customer as string | null;
  const packageId = session.metadata?.packageId;
  const customerName = session.metadata?.customerName || session.customer_details?.name || "Unknown";
  const customerEmail = session.metadata?.customerEmail || session.customer_details?.email || session.customer_email || "";
  const customerPhone = session.metadata?.customerPhone || session.customer_details?.phone || "";
  // studentName is the child/participant; customerName is the paying parent/guardian
  const studentName = session.metadata?.studentName || null;

  if (!packageId) {
    console.error("[Stripe Webhook] Missing packageId in session metadata", { sessionId: session.id, metadata: session.metadata });
    return;
  }

  const packageIdInt = parseInt(packageId);

  // Check if an enrollment for this Stripe session already exists (idempotency guard)
  if (subscriptionId) {
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.stripeSubscriptionId, subscriptionId))
      .limit(1);
    if (existing) {
      console.log("[Stripe Webhook] Enrollment already exists for subscription:", subscriptionId, "- skipping duplicate");
      return;
    }
  }

  // Fetch the membership package to get pricing info
  const [pkg] = await db
    .select()
    .from(membershipPackages)
    .where(eq(membershipPackages.id, packageIdInt))
    .limit(1);

  if (!pkg) {
    console.error("[Stripe Webhook] Membership package not found:", packageId);
    return;
  }

  // Determine amounts from the Stripe session
  const amountTotal = session.amount_total ? session.amount_total / 100 : parseFloat(pkg.downPayment ?? "0");
  const monthlyPrice = parseFloat(pkg.monthlyPrice ?? "0");
  // Down payment is total minus first month (if paid), otherwise the full amount_total
  const downPaymentAmount = amountTotal > monthlyPrice ? amountTotal - monthlyPrice : amountTotal;
  const remainingBalance = 0; // Stripe subscription handles recurring billing

  // Create a new enrollment record
  await db.insert(enrollments).values({
    membershipPackageId: packageIdInt,
    customerName,
    customerEmail,
    customerPhone,
    studentName,
    stripeCustomerId: customerId ?? null,
    stripeSubscriptionId: subscriptionId ?? null,
    downPaymentAmount: downPaymentAmount.toFixed(2),
    paidFirstMonth: amountTotal > monthlyPrice ? 1 : 0,
    remainingBalance: remainingBalance.toFixed(2),
    monthlyPaymentsRemaining: 0, // Stripe manages recurring
    status: "active",
    startDate: new Date(),
    beltRank: "No Belt",
    totalXP: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  console.log("[Stripe Webhook] New enrollment created for:", customerName, "(", customerEmail, ") - package:", pkg.name);
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.created:", subscription.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  // Find enrollment by subscription ID
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!enrollment) {
    console.log("[Stripe Webhook] No enrollment found for subscription:", subscription.id);
    return;
  }

  // Update enrollment status
  await db
    .update(enrollments)
    .set({
      status: "active",
    })
    .where(eq(enrollments.id, enrollment.id));

  console.log("[Stripe Webhook] Subscription activated for enrollment:", enrollment.id);
}

/**
 * Handle customer.subscription.updated event
 * Updates enrollment status based on subscription status
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.updated:", subscription.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  // Find enrollment by subscription ID
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!enrollment) {
    console.log("[Stripe Webhook] No enrollment found for subscription:", subscription.id);
    return;
  }

  // Map Stripe subscription status to enrollment status
  let enrollmentStatus: "active" | "cancelled" | "pending" | "completed" | "failed" = "active";

  switch (subscription.status) {
    case "active":
      enrollmentStatus = "active";
      break;
    case "past_due":
    case "unpaid":
      enrollmentStatus = "failed";
      break;
    case "canceled":
    case "incomplete_expired":
      enrollmentStatus = "cancelled";
      break;
    case "incomplete":
    case "trialing":
      enrollmentStatus = "pending";
      break;
  }

  // Update enrollment status
  await db
    .update(enrollments)
    .set({
      status: enrollmentStatus,
    })
    .where(eq(enrollments.id, enrollment.id));

  console.log("[Stripe Webhook] Enrollment status updated:", enrollment.id, "->", enrollmentStatus);
}

/**
 * Handle customer.subscription.deleted event
 * Marks enrollment as cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.deleted:", subscription.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  // Find enrollment by subscription ID
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!enrollment) {
    console.log("[Stripe Webhook] No enrollment found for subscription:", subscription.id);
    return;
  }

  // Mark enrollment as cancelled
  await db
    .update(enrollments)
    .set({
      status: "cancelled",
      completionDate: new Date(),
    })
    .where(eq(enrollments.id, enrollment.id));

  console.log("[Stripe Webhook] Enrollment cancelled:", enrollment.id);
}

/**
 * Handle invoice.payment_failed event
 * Marks enrollment as failed when payment fails
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("[Stripe Webhook] Processing invoice.payment_failed:", invoice.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  const subscriptionId = (invoice as any).subscription as string | undefined;

  if (!subscriptionId) {
    console.log("[Stripe Webhook] No subscription ID in invoice");
    return;
  }

  // Find enrollment by subscription ID
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!enrollment) {
    console.log("[Stripe Webhook] No enrollment found for subscription:", subscriptionId);
    return;
  }

  // Mark enrollment as failed
  await db
    .update(enrollments)
    .set({
      status: "failed",
    })
    .where(eq(enrollments.id, enrollment.id));

  console.log("[Stripe Webhook] Enrollment marked as failed due to payment failure:", enrollment.id);
}
