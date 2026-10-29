import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import {
  getPayPalAccessToken,
  verifyPayPalWebhookSignature,
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrder,
  createMonthlySubscription,
} from "./paypalHelper";

export const paypalRouter = Router();

const PARTY_PRICES: Record<string, { name: string; amountCents: number }> = {
  ninja: { name: "Ninja Party", amountCents: 19_900 },
  champion: { name: "Champion Party", amountCents: 29_900 },
  blackbelt: { name: "Black Belt VIP Party", amountCents: 44_900 },
};

async function markPartyOrderPaid(orderId: string, captureId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const order = await getPayPalOrder(orderId);
  const unit = order.purchase_units?.[0];
  const [booking] = await db.select().from(schema.partyBookings)
    .where(eq(schema.partyBookings.paypalOrderId, orderId)).limit(1);
  if (!booking) throw new Error("PayPal order is not linked to a MyDojo party booking");
  const expectedReference = `party-${booking.bookingReference}`;
  const actualAmount = unit?.amount?.value;
  const actualCurrency = unit?.amount?.currency_code;
  if (unit?.reference_id !== expectedReference || actualCurrency !== booking.currency || actualAmount !== (booking.amountCents / 100).toFixed(2)) {
    throw new Error("PayPal order does not match the stored booking amount or reference");
  }
  if (booking.status === "paid") return booking;
  await db.update(schema.partyBookings).set({
    status: "paid",
    paypalCaptureId: captureId ?? booking.paypalCaptureId,
    paidAt: new Date(),
    lastError: null,
  }).where(and(eq(schema.partyBookings.id, booking.id), eq(schema.partyBookings.status, "pending")));
  return booking;
}

async function markPnoOrderPaid(orderId: string, captureId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const order = await getPayPalOrder(orderId);
  const unit = order.purchase_units?.[0];
  const [rsvp] = await db.select().from(schema.pnoRsvps)
    .where(eq(schema.pnoRsvps.paypalOrderId, orderId)).limit(1);
  if (!rsvp) return false;
  const expectedReference = `pno-${rsvp.id}`;
  const actualAmount = unit?.amount?.value;
  const actualCurrency = unit?.amount?.currency_code;
  if (unit?.reference_id !== expectedReference || actualCurrency !== "USD" || actualAmount !== (rsvp.amountCents / 100).toFixed(2)) {
    throw new Error("PayPal PNO order does not match the stored registration amount or reference");
  }
  if (rsvp.paymentStatus === "paid") return true;
  await db.update(schema.pnoRsvps).set({
    paymentStatus: "paid",
    paypalCaptureId: captureId ?? rsvp.paypalCaptureId,
    paidAt: new Date(),
  }).where(and(eq(schema.pnoRsvps.id, rsvp.id), eq(schema.pnoRsvps.paymentStatus, "pending")));
  try {
    const { notifyOwner } = await import("./_core/notification");
    await notifyOwner({
      title: "Haunted Dojo RSVP Paid",
      content: `${rsvp.parentName} paid $${(rsvp.amountCents / 100).toFixed(2)} for ${rsvp.studentNames}. Emergency contact: ${rsvp.emergencyContactName} (${rsvp.emergencyContactPhone}).`,
    });
  } catch {}
  return true;
}

async function markBeltOrderPaid(orderId: string, captureId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const order = await getPayPalOrder(orderId);
  const unit = order.purchase_units?.[0];
  const intents = await db.select().from(schema.beltTestIntents)
    .where(eq(schema.beltTestIntents.paypalOrderId, orderId));
  if (!intents.length) return false;
  const expectedAmount = intents.reduce((sum, intent) => {
    const storedAmount = Number(intent.paymentAmountCents);
    return sum + (Number.isSafeInteger(storedAmount) && storedAmount > 0 ? storedAmount : 4900);
  }, 0);
  const expectedReference = `belt-${intents[0].groupId || intents[0].id}`;
  const actualAmount = unit?.amount?.value;
  const actualCurrency = unit?.amount?.currency_code;
  if (unit?.reference_id !== expectedReference || actualCurrency !== "USD" || actualAmount !== (expectedAmount / 100).toFixed(2)) {
    throw new Error("PayPal belt-test order does not match the stored intent amount or reference");
  }
  if (intents.every((intent) => intent.paymentStatus === "paid")) return true;
  const amountPerIntent = intents.length === 1 ? expectedAmount : 4900;
  const includesGear = intents.some((intent) => intent.equipmentChoice === "add");
  await db.update(schema.beltTestIntents).set({
    paymentStatus: "paid",
    paypalCaptureId: captureId ?? null,
    amountPaid: amountPerIntent,
    paymentProvider: "paypal",
    paymentReference: orderId,
    ...(includesGear ? { equipmentPaymentStatus: "paid" } : {}),
  }).where(eq(schema.beltTestIntents.paypalOrderId, orderId));
  try {
    const { notifyOwner } = await import("./_core/notification");
    await notifyOwner({
      title: "October Belt Test Paid",
      content: `${intents.map((intent) => intent.studentName).join(", ")} — ${intents.length} intent(s) paid $${(expectedAmount / 100).toFixed(2)} via PayPal.`,
    });
  } catch {}
  return true;
}

async function markGearOrderPaid(orderId: string, captureId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const order = await getPayPalOrder(orderId);
  const unit = order.purchase_units?.[0];
  const [gear] = await db.select().from(schema.gearOrders)
    .where(eq(schema.gearOrders.paypalOrderId, orderId)).limit(1);
  if (!gear) return false;
  const expectedReference = gear.orderReference;
  const actualAmount = unit?.amount?.value;
  const actualCurrency = unit?.amount?.currency_code;
  if (unit?.reference_id !== expectedReference || actualCurrency !== gear.currency || actualAmount !== (gear.amountCents / 100).toFixed(2)) {
    throw new Error("PayPal gear order does not match the stored amount or reference");
  }
  if (gear.paymentStatus === "paid") return true;
  if (gear.paymentStatus !== "pending") throw new Error(`PayPal gear order is not pending (status: ${gear.paymentStatus})`);
  await db.update(schema.gearOrders).set({
    paymentStatus: "paid",
    paymentProvider: "paypal",
    paymentReference: orderId,
    paypalCaptureId: captureId ?? gear.paypalCaptureId,
    paidAt: new Date(),
    lastError: null,
  }).where(and(eq(schema.gearOrders.id, gear.id), eq(schema.gearOrders.paymentStatus, "pending")));
  return true;
}

paypalRouter.get("/health", async (_req, res) => {
  try {
    await getPayPalAccessToken();
    res.json({
      connected: true,
      environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
      merchantConfigured: Boolean(process.env.PAYPAL_MERCHANT_ID),
      webhookConfigured: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    });
  } catch {
    res.status(503).json({ connected: false });
  }
});

paypalRouter.post("/webhook", async (req, res) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const event = req.body as { id?: string; event_type?: string; resource?: any; resource_version?: string };
  if (!webhookId || !event?.id || !event.event_type) return res.status(503).json({ error: "Webhook is not configured" });
  try {
    const verified = await verifyPayPalWebhookSignature(webhookId, req.headers, event);
    if (!verified) return res.status(400).json({ error: "Invalid signature" });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const [existing] = await db.select().from(schema.paypalEvents)
      .where(eq(schema.paypalEvents.paypalEventId, event.id)).limit(1);
    if (existing?.processingStatus === "processed" || existing?.processingStatus === "ignored") return res.status(200).json({ received: true, duplicate: true });
    if (!existing) {
      await db.insert(schema.paypalEvents).values({
        paypalEventId: event.id,
        eventType: event.event_type,
        resourceId: String(event.resource?.id ?? "").slice(0, 128) || null,
        rawPayload: event as any,
        signatureValid: true,
        processingStatus: "pending",
      });
    }
    const orderId = event.resource?.supplementary_data?.related_ids?.order_id
      ?? (event.event_type.startsWith("CHECKOUT.ORDER.") ? event.resource?.id : undefined);
    const customId = String(event.resource?.custom_id ?? "");
    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED" && customId.startsWith("enrollment-")) {
      const enrollmentId = Number(customId.slice("enrollment-".length));
      if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) throw new Error("Invalid PayPal enrollment reference");
      await db.update(schema.enrollments).set({ status: "active", paypalSubscriptionId: String(event.resource?.id ?? "") }).where(eq(schema.enrollments.id, enrollmentId));
      await db.update(schema.paypalEvents).set({ processingStatus: "processed", processedAt: new Date() }).where(eq(schema.paypalEvents.paypalEventId, event.id));
      return res.status(200).json({ received: true });
    }
    if (["BILLING.SUBSCRIPTION.CANCELLED", "BILLING.SUBSCRIPTION.SUSPENDED"].includes(event.event_type) && customId.startsWith("enrollment-")) {
      const enrollmentId = Number(customId.slice("enrollment-".length));
      if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) throw new Error("Invalid PayPal enrollment reference");
      await db.update(schema.enrollments).set({ status: "cancelled" }).where(eq(schema.enrollments.id, enrollmentId));
      await db.update(schema.paypalEvents).set({ processingStatus: "processed", processedAt: new Date() }).where(eq(schema.paypalEvents.paypalEventId, event.id));
      return res.status(200).json({ received: true });
    }
    if (["CHECKOUT.ORDER.COMPLETED", "PAYMENT.CAPTURE.COMPLETED"].includes(event.event_type) && orderId) {
      const captureId = event.event_type === "PAYMENT.CAPTURE.COMPLETED" ? String(event.resource?.id ?? "") : undefined;
      const [party] = await db.select().from(schema.partyBookings)
        .where(eq(schema.partyBookings.paypalOrderId, String(orderId))).limit(1);
      if (party) {
        await markPartyOrderPaid(String(orderId), captureId);
      } else if (!(await markPnoOrderPaid(String(orderId), captureId)) && !(await markBeltOrderPaid(String(orderId), captureId)) && !(await markGearOrderPaid(String(orderId), captureId))) {
        throw new Error("PayPal completed order is not linked to a MyDojo registration");
      }
      await db.update(schema.paypalEvents).set({ processingStatus: "processed", processedAt: new Date() }).where(eq(schema.paypalEvents.paypalEventId, event.id));
    } else {
      await db.update(schema.paypalEvents).set({ processingStatus: "ignored", processedAt: new Date() }).where(eq(schema.paypalEvents.paypalEventId, event.id));
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[PayPal webhook]", error);
    try {
      const db = await getDb();
      if (db && event?.id) await db.update(schema.paypalEvents).set({ processingStatus: "error", processingError: String(error).slice(0, 500) }).where(eq(schema.paypalEvents.paypalEventId, event.id));
    } catch {}
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

paypalRouter.post("/subscribe", async (req, res) => {
  const plan = String(req.body?.plan || "");
  const plans: Record<string, { id?: string; amountCents: number }> = {
    basic: { id: process.env.PAYPAL_PLAN_BASIC, amountCents: 14_900 },
    black_belt: { id: process.env.PAYPAL_PLAN_BLACK_BELT, amountCents: 19_900 },
    leadership: { id: process.env.PAYPAL_PLAN_LEADERSHIP, amountCents: 24_900 },
  };
  const selected = plans[plan];
  const referenceId = String(req.body?.referenceId || "");
  if (!selected?.id || !/^[a-zA-Z0-9_-]{4,100}$/.test(referenceId)) return res.status(400).json({ error: "Unknown plan or invalid reference" });
  const origin = process.env.PUBLIC_SITE_URL || "https://www.mydojoma.com";
  try {
    const result = await createMonthlySubscription(selected.id, referenceId, `${origin}/?paypal=approved`, `${origin}/?paypal=cancelled`);
    return res.json({ ...result, amountCents: selected.amountCents });
  } catch (error) {
    console.error("[PayPal subscribe]", error);
    return res.status(502).json({ error: "PayPal subscription unavailable" });
  }
});

paypalRouter.post("/capture-order", async (req, res) => {
  const orderId = String(req.body?.orderId || "");
  if (!/^[A-Z0-9]{8,32}$/i.test(orderId)) return res.status(400).json({ error: "Invalid PayPal order" });
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const [party] = await db.select({ id: schema.partyBookings.id }).from(schema.partyBookings).where(eq(schema.partyBookings.paypalOrderId, orderId)).limit(1);
    const [pno] = await db.select({ id: schema.pnoRsvps.id }).from(schema.pnoRsvps).where(eq(schema.pnoRsvps.paypalOrderId, orderId)).limit(1);
    const [belt] = await db.select({ id: schema.beltTestIntents.id }).from(schema.beltTestIntents).where(eq(schema.beltTestIntents.paypalOrderId, orderId)).limit(1);
    const [gear] = await db.select({ id: schema.gearOrders.id }).from(schema.gearOrders).where(eq(schema.gearOrders.paypalOrderId, orderId)).limit(1);
    if (!party && !pno && !belt && !gear) return res.status(404).json({ error: "PayPal order is not linked to a MyDojo registration" });
    const current = await getPayPalOrder(orderId);
    const captured = current.status === "COMPLETED" ? { captureId: undefined } : await capturePayPalOrder(orderId);
    if (party) await markPartyOrderPaid(orderId, captured.captureId);
    else if (pno) await markPnoOrderPaid(orderId, captured.captureId);
    else if (belt) await markBeltOrderPaid(orderId, captured.captureId);
    else await markGearOrderPaid(orderId, captured.captureId);
    if (gear) {
      const [paidGear] = await db.select({
        orderReference: schema.gearOrders.orderReference,
        productName: schema.gearOrders.productName,
        studentName: schema.gearOrders.studentName,
        size: schema.gearOrders.size,
        color: schema.gearOrders.color,
        amountCents: schema.gearOrders.amountCents,
        paymentStatus: schema.gearOrders.paymentStatus,
      }).from(schema.gearOrders).where(eq(schema.gearOrders.paypalOrderId, orderId)).limit(1);
      return res.json({ received: true, status: paidGear?.paymentStatus === "paid" ? "paid" : "pending", order: paidGear ?? null });
    }
    return res.json({ received: true, status: "paid" });
  } catch (error) {
    console.error("[PayPal capture-order]", error);
    return res.status(502).json({ error: "PayPal payment could not be verified" });
  }
});

paypalRouter.get("/party-complete", async (req, res) => {
  // Hosted Payment Links do not return a trusted booking identifier to this app.
  // Never capture or mark a booking paid because a browser reached this route.
  return res.redirect(303, "/birthday-parties?payment=pending");
});
