import { Router } from "express";
import { getPayPalAccessToken, verifyPayPalWebhookSignature } from "./paypalHelper";

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
