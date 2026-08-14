import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { enrollments, membershipPackages, trialSignups, beltTestIntents, eventRegistrations, shopOrders, introOfferPurchases, dayPasses, attendance, familyGroups, paymentFailures, summerCampEnrollments, familyKickboxingAddOns, scheduledPayments } from "../drizzle/schema";
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
        // Route based on metadata type
        if (session.metadata?.type === "belt_exam") {
          await handleBeltExamPayment(session);
        } else if (session.metadata?.type === "belt_test_intent") {
          await handleBeltTestIntentPayment(session);
        } else if (session.metadata?.type === "event_registration") {
          await handleEventRegistrationPayment(session);
        } else if (session.metadata?.type === "intro_offer") {
          await handleIntroOfferPayment(session);
        } else if (session.metadata?.type === "shop_purchase") {
          await handleShopPurchase(session);
        } else if (session.metadata?.type === "day_pass") {
          await handleDayPassPurchase(session);
        } else if (session.metadata?.type === "family_registration") {
          await handleFamilyRegistration(session);
        } else if (session.metadata?.type === "summer_camp_enrollment") {
          await handleSummerCampEnrollment(session);
        } else if (session.metadata?.type === "family_kickboxing_addon") {
          await handleFamilyKickboxingAddOn(session);
        } else if (session.metadata?.type === "scheduled_payment_setup") {
          await handleScheduledPaymentSetup(session);
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

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
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

/** Records a paid Pro Shop order for staff fulfillment. */
async function handleShopPurchase(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available for shop order");
    return;
  }

  const [existing] = await db.select().from(shopOrders).where(eq(shopOrders.stripeSessionId, session.id)).limit(1);
  if (existing) {
    console.log("[Stripe Webhook] Shop order already recorded:", session.id);
    return;
  }

  const metadata = session.metadata ?? {};
  const customerName = metadata.customer_name || session.customer_details?.name || "MyDojo Member";
  const customerEmail = session.customer_details?.email || session.customer_email || "";
  const productName = metadata.product_name || "MyDojo Pro Shop Item";
  const amountCents = session.amount_total ?? 0;

  await db.insert(shopOrders).values({
    stripeSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    customerName,
    customerEmail,
    customerPhone: metadata.customer_phone || null,
    productId: metadata.product_id || "unknown",
    productName,
    productCategory: metadata.product_category || "Pro Shop",
    size: metadata.size || null,
    amountCents,
    paymentStatus: "paid",
    fulfillmentStatus: "pending",
  });

  await notifyOwner({
    title: `Pro Shop Order — ${productName}`,
    content: `${customerName} purchased ${productName}${metadata.size ? ` (size ${metadata.size})` : ""} for $${(amountCents / 100).toFixed(2)}. Order is ready for fulfillment. Stripe session: ${session.id}`,
  });
  console.log("[Stripe Webhook] Recorded shop order:", session.id);
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

  // Mark enrollment as failed and create one visible recovery record per
  // invoice. This gives staff a concrete card-update path instead of a silent
  // recurring failure.
  await db
    .update(enrollments)
    .set({ status: "failed" })
    .where(eq(enrollments.id, enrollment.id));

  const [openFailure] = await db.select().from(paymentFailures)
    .where(eq(paymentFailures.stripeInvoiceId, invoice.id)).limit(1);
  if (!openFailure) {
    await db.insert(paymentFailures).values({
      enrollmentId: enrollment.id,
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      amountCents: invoice.amount_due ?? 0,
      failureReason: (invoice as any).last_finalization_error?.message || "Recurring payment failed",
      status: "open",
    });
  }
  await notifyOwner({
    title: `Recurring Payment Needs Attention — ${enrollment.studentName || enrollment.customerName}`,
    content: `A recurring payment failed for ${enrollment.customerName}. The member can update their payment method from Account, or staff can update it in the admin panel.`,
  });
  console.log("[Stripe Webhook] Enrollment marked as failed due to payment failure:", enrollment.id);
}

/** Restores active billing status and resolves recovery records after a successful retry. */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;
  const subscriptionId = (invoice as any).subscription as string | undefined;
  if (!subscriptionId) return;
  const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.stripeSubscriptionId, subscriptionId)).limit(1);
  if (!enrollment) return;
  await db.update(enrollments).set({ status: "active" }).where(eq(enrollments.id, enrollment.id));
  await db.update(paymentFailures).set({ status: "resolved" }).where(eq(paymentFailures.stripeSubscriptionId, subscriptionId));
  console.log("[Stripe Webhook] Recurring payment succeeded for enrollment:", enrollment.id);
}

/**
 * Handle intro offer payment (checkout.session.completed with metadata.type === 'intro_offer')
 * Creates a trial signup record and notifies the owner.
 */
async function handleIntroOfferPayment(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Processing intro offer payment:", session.id);

  // Test event guard
  if ((session as any).id?.startsWith('evt_test_')) {
    console.log("[Stripe Webhook] Test event detected for intro offer, skipping");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available for intro offer");
    return;
  }

  const customerName = session.metadata?.customerName || session.customer_details?.name || "Unknown";
  const customerEmail = session.metadata?.customerEmail || session.customer_details?.email || session.customer_email || "";
  const customerPhone = session.metadata?.customerPhone || session.customer_details?.phone || "";
  const program = session.metadata?.program || "Not Sure";
  const amountPaid = session.amount_total ? session.amount_total / 100 : 29;
  const introOfferPackage = session.metadata?.introOfferPackage;

  // New hosted intro-offer checkout: create the class-pass record first. The
  // Stripe session ID makes the webhook idempotent and removes the old
  // ambiguous legacy transaction field from all new purchases.
  if (introOfferPackage === "starter" || introOfferPackage === "explorer") {
    const [existingPurchase] = await db
      .select()
      .from(introOfferPurchases)
      .where(eq(introOfferPurchases.stripeCheckoutSessionId, session.id))
      .limit(1);
    if (!existingPurchase) {
      const classesIncluded = introOfferPackage === "starter" ? 3 : 5;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await db.insert(introOfferPurchases).values({
        name: customerName,
        email: customerEmail.toLowerCase(),
        phone: customerPhone || null,
        packageId: introOfferPackage,
        amountCents: session.amount_total ?? (introOfferPackage === "starter" ? 2900 : 4900),
        classesIncluded,
        classesRemaining: classesIncluded,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        status: "paid",
        expiresAt,
      });
    }
  }
  const isSummerCampTrial = session.metadata?.type === 'summer_camp_intro';

  // Map program string to valid enum value
  const programMap: Record<string, string> = {
    "Little Ninjas": "Little Ninjas",
    "Kids Martial Arts": "Dragon Kids",
    "Dragon Kids": "Dragon Kids",
    "Teens & Adults": "Teens",
    "Teens": "Teens",
    "Adult Karate": "Adult Karate",
    "Kickboxing": "Kickboxing",
    "Kickboxing Fitness": "Kickboxing",
    "Summer Camp": "Summer Camp",
  };
  const mappedProgram = programMap[program] || "Not Sure";

  // Parse trial dates from metadata (Summer Camp 3-day trial)
  const trialStartDate = session.metadata?.trialStartDate ? new Date(session.metadata.trialStartDate) : new Date();
  const membershipActivationDate = session.metadata?.membershipActivationDate
    ? new Date(session.metadata.membershipActivationDate)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  // Idempotency: check if a trial signup with this session ID already exists
  const existing = await db
    .select()
    .from(trialSignups)
    .where(eq(trialSignups.email, customerEmail.toLowerCase()))
    .limit(1);

  if (existing.length > 0 && existing[0].source === 'intro_offer_stripe') {
    console.log("[Stripe Webhook] Intro offer trial signup already exists for:", customerEmail);
    return;
  }

  // Create trial signup record
  try {
    await db.insert(trialSignups).values({
      name: customerName,
      email: customerEmail.toLowerCase(),
      phone: customerPhone,
      program: mappedProgram as any,
      status: "new",
      source: "intro_offer_stripe" as any,
      location: "HQ",
      notes: `Paid $${amountPaid} ${isSummerCampTrial ? 'Summer Camp 3-day trial' : 'intro offer'} via Stripe. Session: ${session.id}`,
      ...(isSummerCampTrial ? {
        trialStartDate,
        membershipActivationDate,
        membershipActivated: false,
      } : {}),
    } as any);
    console.log("[Stripe Webhook] Intro offer trial signup created for:", customerName, "(", customerEmail, ")");
  } catch (err) {
    console.error("[Stripe Webhook] Failed to create intro offer trial signup:", err);
  }

  // Summer Camp trial: send cancellation-by-Day-3 SMS warning
  if (isSummerCampTrial && customerPhone) {
    try {
      const { sendSms } = await import('./sms800.js');
      const activationDateStr = membershipActivationDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const cancelDeadlineStr = new Date(membershipActivationDate.getTime() - 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      await sendSms({
        to: customerPhone,
        message: `🏕️ Hi ${customerName.split(' ')[0]}! Your MyDojo Summer Camp 3-Day Trial is confirmed! 🎉\n\n` +
          `Your child can attend camp for 3 days starting today.\n\n` +
          `⚠️ IMPORTANT: If you do NOT wish to continue with a full MyDojo membership, you MUST cancel by ${cancelDeadlineStr} (Day 3).\n\n` +
          `On ${activationDateStr} (Day 4), your full membership will automatically activate and regular tuition will begin.\n\n` +
          `To cancel, call or text us at (877) 4-MYDOJO before Day 3. We hope you love it! 🥋`,
      });
    } catch (smsErr) {
      console.error('[Stripe Webhook] Failed to send Summer Camp trial cancellation warning SMS:', smsErr);
    }
  }

  // Send welcome email to the customer
  try {
    const { sendIntroOfferWelcomeEmail } = await import("./emailService.js");
    await sendIntroOfferWelcomeEmail({
      toEmail: customerEmail,
      customerName,
      program,
      amountPaid,
      isSummerCamp: program.toLowerCase().includes("summer"),
    });
  } catch (emailErr) {
    console.error("[Stripe Webhook] Failed to send intro offer welcome email:", emailErr);
  }

  // Notify owner
  try {
    await notifyOwner({
      title: `New Intro Offer Purchase — ${customerName}`,
      content: `${customerName} (${customerEmail}, ${customerPhone}) paid $${amountPaid} for the ${program} intro offer. Stripe session: ${session.id}`,
    });
  } catch (notifErr) {
    console.error("[Stripe Webhook] Failed to send owner notification for intro offer:", notifErr);
  }
}
/**
 * Handle belt test intent payment (checkout.session.completed with metadata.type === 'belt_test_intent')
 * Marks the beltTestIntents record as paid and sends confirmation SMS/email.
 */
async function handleBeltTestIntentPayment(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Processing belt test intent payment:", session.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  const intentId = session.metadata?.intent_id ? parseInt(session.metadata.intent_id) : null;
  const studentName = session.metadata?.student_name || "Student";
  const parentName = session.metadata?.parent_name || "Parent";
  const phone = session.metadata?.phone || "";
  const amountPaid = session.amount_total ? session.amount_total / 100 : 49;

  if (intentId) {
    // Check idempotency
    const [existing] = await db.select().from(beltTestIntents).where(eq(beltTestIntents.id, intentId)).limit(1);
    if (existing && existing.paymentStatus === "paid") {
      console.log("[Stripe Webhook] Belt test intent already paid:", intentId, "— skipping");
      return;
    }

    await db.update(beltTestIntents).set({
      paymentStatus: "paid",
      stripeSessionId: session.id,
      amountPaid: Math.round(amountPaid * 100),
    }).where(eq(beltTestIntents.id, intentId));
  }

  // Send confirmation SMS
  if (phone) {
    try {
      const { sendSms } = await import("./sms800.js");
      await sendSms({
        to: phone,
        message: `✅ MyDojo: Your Intent to Promote form for ${studentName} is confirmed! Belt Test is August 15th. Questions? Call (877) 4-MYDOJO.`,
      });
    } catch (smsErr) {
      console.error("[Stripe Webhook] Failed to send belt test intent SMS:", smsErr);
    }
  }

  // Notify owner
  try {
    await notifyOwner({
      title: `🥋 Belt Test Intent Submitted — ${studentName}`,
      content: `${parentName} submitted the Intent to Promote form for ${studentName} and paid $${amountPaid}. Belt Test: August 15th. Phone: ${phone}. Stripe session: ${session.id}`,
    });
  } catch (notifErr) {
    console.error("[Stripe Webhook] Failed to send owner notification:", notifErr);
  }

  console.log(`[Stripe Webhook] Belt test intent confirmed for ${studentName} — $${amountPaid}`);
}

/**
 * Handle event registration payment (checkout.session.completed with metadata.type === 'event_registration')
 * Marks the eventRegistrations record as paid and sends confirmation SMS.
 */
async function handleEventRegistrationPayment(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Processing event registration payment:", session.id);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  const registrationId = session.metadata?.registration_id ? parseInt(session.metadata.registration_id) : null;
  const eventId = session.metadata?.event_id || "unknown";
  const name = session.metadata?.name || "Attendee";
  const phone = session.metadata?.phone || "";
  const amountPaid = session.amount_total ? session.amount_total / 100 : 0;

  if (registrationId) {
    const [existing] = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, registrationId)).limit(1);
    if (existing && existing.paymentStatus === "paid") {
      console.log("[Stripe Webhook] Event registration already paid:", registrationId, "— skipping");
      return;
    }

    await db.update(eventRegistrations).set({
      paymentStatus: "paid",
      stripeSessionId: session.id,
      amountPaid: Math.round(amountPaid * 100),
    }).where(eq(eventRegistrations.id, registrationId));
  }

  // Send confirmation SMS
  if (phone) {
    try {
      const { sendSms } = await import("./sms800.js");
      const eventMessages: Record<string, string> = {
        "pno-aug-2026": `🌟 MyDojo: You're registered for Parents Night Out on August 21st, 6PM-9:30PM! Ninja Warrior Course Glow Night. See you there! — (877) 4-MYDOJO`,
        "master-yaeger-seminar-aug-2026": `🥋 MyDojo: You're registered for the Master Yaeger Seminar on August 22nd, 11AM-2PM! Get ready for an amazing training experience. — (877) 4-MYDOJO`,
      };
      const msg = eventMessages[eventId] || `✅ MyDojo: Your registration for ${eventId} is confirmed! See you there. — (877) 4-MYDOJO`;
      await sendSms({ to: phone, message: msg });
    } catch (smsErr) {
      console.error("[Stripe Webhook] Failed to send event registration SMS:", smsErr);
    }
  }

  // Notify owner
  try {
    await notifyOwner({
      title: `🎉 Event Registration — ${name}`,
      content: `${name} registered for ${eventId} and paid $${amountPaid}. Phone: ${phone}. Stripe session: ${session.id}`,
    });
  } catch (notifErr) {
    console.error("[Stripe Webhook] Failed to send owner notification:", notifErr);
  }

  console.log(`[Stripe Webhook] Event registration confirmed for ${name} — ${eventId} — $${amountPaid}`);
}

/** Records a paid day pass and guest attendance after hosted checkout. */
async function handleDayPassPurchase(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for day pass");

  const [existing] = await db.select().from(dayPasses).where(eq(dayPasses.stripeCheckoutSessionId, session.id)).limit(1);
  if (existing) return;

  const metadata = session.metadata ?? {};
  const name = metadata.customerName || session.customer_details?.name || "Guest";
  const email = metadata.customerEmail || session.customer_details?.email || session.customer_email || "";
  const program = metadata.program || "Day Pass";
  const checkInAt = new Date();

  await db.insert(dayPasses).values({
    name,
    email,
    phone: metadata.customerPhone || session.customer_details?.phone || null,
    program,
    amountCents: session.amount_total ?? 0,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    status: "paid",
    classId: metadata.classId ? Number.parseInt(metadata.classId, 10) : null,
  } as any);
  await db.insert(attendance).values({
    studentId: 0,
    checkInDate: checkInAt.toISOString().slice(0, 10),
    checkInTimestamp: checkInAt,
    beltRankAtCheckIn: "Guest",
    programType: metadata.programType || program,
    source: "kiosk",
    xpAwarded: 0,
    notes: `Secure day pass ${session.id} — ${name}`,
  } as any);

  await notifyOwner({
    title: `Day Pass Paid — ${name}`,
    content: `${name} purchased a ${program} day pass for $${((session.amount_total ?? 0) / 100).toFixed(2)}.`,
  });
}

/** Creates the paid family record after hosted family registration checkout. */
async function handleFamilyRegistration(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for family registration");
  const [existing] = await db.select().from(familyGroups).where(eq(familyGroups.stripeCheckoutSessionId, session.id)).limit(1);
  if (existing) return;
  const metadata = session.metadata ?? {};
  const name = metadata.primaryContactName || session.customer_details?.name || "MyDojo Family";
  const email = metadata.primaryContactEmail || session.customer_details?.email || session.customer_email || "";
  await db.insert(familyGroups).values({
    primaryContactName: name,
    primaryContactEmail: email,
    primaryContactPhone: metadata.primaryContactPhone || session.customer_details?.phone || null,
    registrationFeePaid: 1,
    registrationFeeAmount: ((session.amount_total ?? 9900) / 100).toFixed(2),
    registrationFeePaidAt: new Date(),
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
  } as any);
  await notifyOwner({ title: `Family Registration Paid — ${name}`, content: `${name} completed the $99 family registration. Add family members from the admin portal.` });
}

/** Creates one paid summer camp enrollment after a completed hosted checkout. */
async function handleSummerCampEnrollment(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for summer camp enrollment");
  const [existing] = await db.select().from(summerCampEnrollments).where(eq(summerCampEnrollments.stripeCheckoutSessionId, session.id)).limit(1);
  if (existing) return;
  const metadata = session.metadata ?? {};
  const students = metadata.students || "[]";
  const weeks = metadata.weeks || "[]";
  await db.insert(summerCampEnrollments).values({
    parentName: metadata.parentName || session.customer_details?.name || "MyDojo Parent",
    parentEmail: metadata.parentEmail || session.customer_details?.email || session.customer_email || "",
    parentPhone: metadata.parentPhone || session.customer_details?.phone || "",
    students,
    weeks,
    weekCount: Number(metadata.weekCount || 0),
    studentCount: Number(metadata.studentCount || 0),
    isFullSummer: metadata.isFullSummer === "true" ? 1 : 0,
    amountCents: session.amount_total ?? 0,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    status: "approved",
  } as any);
  await notifyOwner({ title: "Summer Camp Enrollment Paid", content: `${metadata.parentName || session.customer_details?.name || "A parent"} completed a summer camp enrollment. Review it in Admin > Summer Camp.` });
}

/** Records a hosted recurring kickboxing add-on exactly once. */
async function handleFamilyKickboxingAddOn(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for family kickboxing add-on");
  const [existing] = await db.select().from(familyKickboxingAddOns).where(eq(familyKickboxingAddOns.stripeCheckoutSessionId, session.id)).limit(1);
  if (existing) return;
  const metadata = session.metadata ?? {};
  await db.insert(familyKickboxingAddOns).values({
    familyGroupId: Number(metadata.familyGroupId || 0),
    memberName: metadata.memberName || "Kickboxing Member",
    memberEmail: metadata.memberEmail || session.customer_details?.email || session.customer_email || "",
    memberPhone: metadata.memberPhone || null,
    monthlyAmount: "49.00",
    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
    stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
    stripeCheckoutSessionId: session.id,
    status: "active",
  } as any);
  await notifyOwner({ title: "Family Kickboxing Add-On Paid", content: `${metadata.memberName || "A family member"} is enrolled in the $49/month kickboxing add-on.` });
}

/** Stores a future scheduled charge after the customer authorizes a reusable payment method. */
async function handleScheduledPaymentSetup(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for scheduled payment setup");
  const setupIntentId = typeof session.setup_intent === "string" ? session.setup_intent : null;
  if (!setupIntentId) throw new Error("Missing setup intent for scheduled payment");
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : null;
  if (!paymentMethodId) throw new Error("Missing reusable payment method for scheduled payment");
  const [existing] = await db.select().from(scheduledPayments).where(eq(scheduledPayments.stripeSetupIntentId, setupIntentId)).limit(1);
  if (existing) return;
  const metadata = session.metadata ?? {};
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  await db.insert(scheduledPayments).values({
    customerName: metadata.customerName || session.customer_details?.name || "Customer",
    customerEmail: metadata.customerEmail || session.customer_details?.email || session.customer_email || null,
    customerPhone: metadata.customerPhone || session.customer_details?.phone || null,
    amount: metadata.amount || "0.00",
    description: metadata.description || "Scheduled MyDojo payment",
    scheduledDate: metadata.scheduledDate as unknown as Date,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
    stripePaymentMethodId: paymentMethodId,
    stripeSetupIntentId: setupIntentId,
    cardLast4: paymentMethod.card?.last4 || null,
    cardBrand: paymentMethod.card?.brand || null,
    status: "pending",
    createdByUserId: Number(metadata.createdByUserId || 0) || null,
  } as any);
}
