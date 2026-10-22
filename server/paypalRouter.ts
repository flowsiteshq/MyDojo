import { Router } from "express";
import { getPayPalAccessToken, verifyPayPalWebhookSignature, createPayPalOrder, capturePayPalOrder, createMonthlySubscription } from "./paypalHelper";

export const paypalRouter = Router();

paypalRouter.get("/health", async (_req, res) => {
  try {
    await getPayPalAccessToken();
    res.json({ connected: true, environment: process.env.PAYPAL_ENVIRONMENT || "sandbox" });
  } catch {
    res.status(503).json({ connected: false });
  }
});

paypalRouter.post("/webhook", async (req, res) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return res.status(503).json({ error: "Webhook ID not configured" });
  try {
    const verified = await verifyPayPalWebhookSignature(webhookId, req.headers, req.body);
    if (!verified) return res.status(400).json({ error: "Invalid signature" });
    // Do not acknowledge fulfillment until a durable event handler is installed.
    return res.status(503).json({ error: "Event processing not configured" });
  } catch {
    return res.status(500).json({ error: "Webhook verification failed" });
  }
});

/**
 * Subscription initiation requires a configured server-side plan ID.
 * Buyer must approve the subscription at PayPal.
 */
paypalRouter.post("/subscribe", async (req, res) => {
  const plan = String(req.body?.plan || "");
  const plans: Record<string, string | undefined> = {
    basic: process.env.PAYPAL_PLAN_BASIC,
    black_belt: process.env.PAYPAL_PLAN_BLACK_BELT,
    leadership: process.env.PAYPAL_PLAN_LEADERSHIP,
  };
  const planId = plans[plan];
  const referenceId = String(req.body?.referenceId || "");
  if (!planId || !/^[a-zA-Z0-9_-]{4,100}$/.test(referenceId)) {
    return res.status(400).json({ error: "Unknown plan or invalid reference" });
  }
  const origin = "https://www.mydojoma.com";
  try {
    const result = await createMonthlySubscription(
      planId, referenceId,
      origin + "/?paypal=approved",
      origin + "/?paypal=cancelled",
    );
    return res.json(result);
  } catch (error) {
    console.error("[PayPal subscribe]", error);
    return res.status(502).json({ error: "PayPal subscription unavailable" });
  }
});

const partyPrices: Record<string, number> = {
  ninja: 19900,
  champion: 29900,
  blackbelt: 44900,
};

paypalRouter.get("/party-complete", async (req, res) => {
  const token = String(req.query.token || "");
  if (!/^[A-Za-z0-9]{8,32}$/.test(token)) return res.redirect(303, "/birthday-parties?payment=cancelled");
  try {
    const capture = await capturePayPalOrder(token);
    if (capture.status !== "COMPLETED") return res.redirect(303, "/birthday-parties?payment=pending");
    const { notifyOwner } = await import("./_core/notification");
    await notifyOwner({
      title: "Birthday Party Payment Completed",
      content: "PayPal order: " + capture.orderId + "\nStatus: COMPLETED. Match with the booking request and confirm the party date.",
    });
    return res.redirect(303, "/birthday-parties?payment=success");
  } catch (error) {
    console.error("[PayPal party capture]", error);
    return res.redirect(303, "/birthday-parties?payment=pending");
  }
});
