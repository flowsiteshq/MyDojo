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
      await markPartyOrderPaid(String(orderId), event.event_type === "PAYMENT.CAPTURE.COMPLETED" ? String(event.resource?.id ?? "") : undefined);
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

paypalRouter.get("/party-complete", async (req, res) => {
  const token = String(req.query.token || "");
  if (!/^[A-Za-z0-9]{8,32}$/.test(token)) return res.redirect(303, "/birthday-parties?payment=cancelled");
  try {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [booking] = await db.select().from(schema.partyBookings).where(eq(schema.partyBookings.paypalOrderId, token)).limit(1);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "paid") {
      const capture = await capturePayPalOrder(token);
      if (capture.status !== "COMPLETED") return res.redirect(303, "/birthday-parties?payment=pending");
      await markPartyOrderPaid(token, capture.captureId);
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({ title: "Birthday Party Payment Completed", content: `Booking ${booking.bookingReference} paid via PayPal. Parent: ${booking.parentName}; date: ${booking.partyDate}; amount: $${(booking.amountCents / 100).toFixed(2)}.` });
    }
    return res.redirect(303, "/birthday-parties?payment=success");
  } catch (error) {
    console.error("[PayPal party capture]", error);
    return res.redirect(303, "/birthday-parties?payment=pending");
  }
});
